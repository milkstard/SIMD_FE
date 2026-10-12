import type { HubConnection } from '@microsoft/signalr';
import { createContext, useContext } from 'react';

export const SignalRContext = createContext<HubConnection | null>(null);

/** Internal to `realtime/`: the hub connection, or null until the provider has created it. */
export const useSignalRConnection = (): HubConnection | null => useContext(SignalRContext);
