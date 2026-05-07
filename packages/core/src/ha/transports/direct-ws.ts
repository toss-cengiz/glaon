// DirectWsTransport — opens a raw WebSocket to the user's HA instance and pumps frames
// to/from HaClient. The HA `auth_required` / `auth` / `auth_ok` handshake is driven by
// HaClient (the same handshake works for cloud relay sessions); this transport is just
// the wire.

import type { HaInboundFrame, HaOutboundFrame } from '../protocol/messages';
import type {
  CloseInfo,
  HaTransport,
  TransportEvent,
  TransportEventHandler,
  TransportSubscription,
} from '../transport';

export interface DirectWsTransportOptions {
  /**
   * HA base URL (e.g. `http://homeassistant.local:8123`). Scheme is rewritten to
   * `ws:` / `wss:` for the WebSocket upgrade.
   */
  readonly baseUrl: string;
  /**
   * WebSocket constructor injection. Defaults to `globalThis.WebSocket` so RN + browser
   * + jsdom share the same path; tests pass a fake constructor.
   */
  readonly webSocketImpl?: typeof WebSocket;
}

interface Listeners {
  message: Set<(frame: HaInboundFrame) => void>;
  close: Set<(info: CloseInfo) => void>;
  error: Set<(err: Error) => void>;
}

export class DirectWsTransport implements HaTransport {
  private socket: WebSocket | null = null;
  private clientInitiatedClose = false;
  private readonly listeners: Listeners = {
    message: new Set(),
    close: new Set(),
    error: new Set(),
  };

  constructor(private readonly options: DirectWsTransportOptions) {}

  connect(): Promise<void> {
    if (this.socket !== null) {
      throw new Error('DirectWsTransport.connect: already connected');
    }
    const url = buildWsUrl(this.options.baseUrl);
    const Ctor = this.options.webSocketImpl ?? globalThis.WebSocket;
    const socket = new Ctor(url);
    this.socket = socket;
    this.clientInitiatedClose = false;

    socket.addEventListener('message', (ev: MessageEvent<string>) => {
      let parsed: HaInboundFrame;
      try {
        parsed = JSON.parse(ev.data) as HaInboundFrame;
      } catch (cause) {
        const err =
          cause instanceof Error ? cause : new Error('DirectWsTransport: malformed frame');
        for (const listener of this.listeners.error) listener(err);
        return;
      }
      for (const listener of this.listeners.message) listener(parsed);
    });

    socket.addEventListener('close', (ev: CloseEvent) => {
      const info: CloseInfo = {
        code: ev.code,
        reason: ev.reason,
        clientInitiated: this.clientInitiatedClose,
      };
      this.socket = null;
      for (const listener of this.listeners.close) listener(info);
    });

    socket.addEventListener('error', () => {
      const err = new Error('DirectWsTransport: socket error');
      for (const listener of this.listeners.error) listener(err);
    });

    return new Promise<void>((resolve, reject) => {
      const onOpen = (): void => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onErrorOnce);
        resolve();
      };
      const onErrorOnce = (): void => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onErrorOnce);
        reject(new Error('DirectWsTransport: failed to open socket'));
      };
      socket.addEventListener('open', onOpen);
      socket.addEventListener('error', onErrorOnce);
    });
  }

  send(frame: HaOutboundFrame): void {
    if (this.socket === null) {
      throw new Error('DirectWsTransport.send: not connected');
    }
    this.socket.send(JSON.stringify(frame));
  }

  on<TEvent extends TransportEvent>(
    event: TEvent,
    handler: TransportEventHandler<TEvent>,
  ): TransportSubscription {
    const bucket = this.listeners[event] as Set<TransportEventHandler<TEvent>>;
    bucket.add(handler);
    return () => {
      bucket.delete(handler);
    };
  }

  close(): Promise<void> {
    if (this.socket === null) return Promise.resolve();
    this.clientInitiatedClose = true;
    return new Promise<void>((resolve) => {
      const socket = this.socket;
      if (socket === null) {
        resolve();
        return;
      }
      socket.addEventListener(
        'close',
        () => {
          resolve();
        },
        { once: true },
      );
      socket.close(1000, 'client closed');
    });
  }
}

function buildWsUrl(baseUrl: string): string {
  const url = new URL('/api/websocket', baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
