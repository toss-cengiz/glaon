// FakeTransport — scripted in-memory HaTransport for unit tests. Exposes hooks for
// pushing inbound frames at the HaClient and recording every outbound frame so
// individual scenarios can assert on the wire format.
//
// Lives under @glaon/core/ha/testing/* — production bundles should not import it; the
// package's `./ha` barrel intentionally does not re-export this path.

import type { HaInboundFrame, HaOutboundFrame } from '../protocol/messages';
import type {
  CloseInfo,
  HaTransport,
  TransportEvent,
  TransportEventHandler,
  TransportSubscription,
} from '../transport';

export class FakeTransport implements HaTransport {
  /** Frames sent by HaClient, in order. */
  readonly sent: HaOutboundFrame[] = [];

  private readonly listeners = {
    message: new Set<(frame: HaInboundFrame) => void>(),
    close: new Set<(info: CloseInfo) => void>(),
    error: new Set<(err: Error) => void>(),
  };
  private isOpen = false;

  /** Override to throw a connect-time error. */
  connectImpl: () => Promise<void> = () => Promise.resolve();

  connect(): Promise<void> {
    return this.connectImpl().then(() => {
      this.isOpen = true;
    });
  }

  send(frame: HaOutboundFrame): void {
    if (!this.isOpen) throw new Error('FakeTransport.send: not connected');
    this.sent.push(frame);
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
    if (!this.isOpen) return Promise.resolve();
    this.isOpen = false;
    const info: CloseInfo = { code: 1000, reason: 'client closed', clientInitiated: true };
    for (const listener of this.listeners.close) listener(info);
    return Promise.resolve();
  }

  /* ---------- test-only helpers ---------- */

  /** Push an inbound frame at HaClient. */
  push(frame: HaInboundFrame): void {
    for (const listener of this.listeners.message) listener(frame);
  }

  /** Simulate a remote-initiated drop. */
  dropFromRemote(reason = 'remote dropped'): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    const info: CloseInfo = { code: 1006, reason, clientInitiated: false };
    for (const listener of this.listeners.close) listener(info);
  }

  emitError(err: Error): void {
    for (const listener of this.listeners.error) listener(err);
  }
}
