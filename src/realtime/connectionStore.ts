import { create } from 'zustand';

export type ConnectionState = 'live' | 'reconnecting' | 'offline';

// UI state only: the real-time connection state. FE-04's SignalRProvider writes it; the shell reads it.
interface ConnectionStore {
  state: ConnectionState;
}

export const useConnectionStore = create<ConnectionStore>(() => ({ state: 'offline' }));

export const useConnectionState = (): ConnectionState => useConnectionStore((store) => store.state);

export const setConnectionState = (state: ConnectionState): void =>
  useConnectionStore.setState({ state });
