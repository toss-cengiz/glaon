import type { HaConnectionConfig, HaEntityState } from '../types';

// Minimal Home Assistant WebSocket client skeleton.
// TODO Phase 1: implement auth handshake, subscription multiplexing, reconnect with backoff.
// Protocol: https://developers.home-assistant.io/docs/api/websocket
export class HaClient {
  private socket: WebSocket | null = null;

  constructor(
    private readonly config: HaConnectionConfig,
    private readonly getAccessToken: () => Promise<string>,
  ) {}

  async connect(): Promise<void> {
    const url = new URL('/api/websocket', this.config.baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(url.toString());
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      socket.addEventListener(
        'open',
        () => {
          resolve();
        },
        { once: true },
      );
      socket.addEventListener(
        'error',
        () => {
          reject(new Error('HA socket error'));
        },
        { once: true },
      );
    });

    const token = await this.getAccessToken();
    socket.send(JSON.stringify({ type: 'auth', access_token: token }));
  }

  getStates(): Promise<readonly HaEntityState[]> {
    return Promise.reject(new Error('not implemented — Phase 1'));
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
  }
}
