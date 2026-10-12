import { vi } from 'vitest';
import { HubConnectionState, type HubConnection } from '@microsoft/signalr';

type Callback = (error?: Error) => void;

/** Test double for HubConnection that records lifecycle callbacks so tests can fire them. */
export function createFakeConnection() {
  const callbacks: { reconnecting: Callback[]; reconnected: Callback[]; close: Callback[] } = {
    reconnecting: [],
    reconnected: [],
    close: [],
  };
  const fake = {
    state: HubConnectionState.Disconnected as HubConnectionState,
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    onreconnecting: vi.fn((cb: Callback) => void callbacks.reconnecting.push(cb)),
    onreconnected: vi.fn((cb: Callback) => void callbacks.reconnected.push(cb)),
    onclose: vi.fn((cb: Callback) => void callbacks.close.push(cb)),
  };
  return {
    fake,
    connection: fake as unknown as HubConnection,
    fire: (event: keyof typeof callbacks) => callbacks[event].forEach((cb) => cb()),
  };
}
