import { vi } from 'vitest';
import { HubConnectionState, type HubConnection } from '@microsoft/signalr';

type Callback = (error?: Error) => void;
type EventHandler = (payload: unknown) => void;

/** Test double for HubConnection that records lifecycle callbacks so tests can fire them. */
export function createFakeConnection() {
  const callbacks: { reconnecting: Callback[]; reconnected: Callback[]; close: Callback[] } = {
    reconnecting: [],
    reconnected: [],
    close: [],
  };
  const handlers = new Map<string, EventHandler[]>();
  const fake = {
    state: HubConnectionState.Disconnected as HubConnectionState,
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    onreconnecting: vi.fn((cb: Callback) => void callbacks.reconnecting.push(cb)),
    onreconnected: vi.fn((cb: Callback) => void callbacks.reconnected.push(cb)),
    onclose: vi.fn((cb: Callback) => void callbacks.close.push(cb)),
    on: vi.fn((event: string, handler: EventHandler) => {
      const list = handlers.get(event) ?? [];
      handlers.set(event, [...list, handler]);
    }),
    off: vi.fn((event: string, handler: EventHandler) => {
      handlers.set(
        event,
        (handlers.get(event) ?? []).filter((h) => h !== handler),
      );
    }),
  };
  return {
    fake,
    connection: fake as unknown as HubConnection,
    /** Invokes the handlers currently registered for a server event. */
    emit: (event: string, payload?: unknown) => (handlers.get(event) ?? []).forEach((h) => h(payload)),
    fire: (event: keyof typeof callbacks) => callbacks[event].forEach((cb) => cb()),
  };
}
