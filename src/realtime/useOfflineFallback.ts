import { HubConnectionState, type HubConnection } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { setConnectionState, useConnectionState } from './connectionStore';

export const OFFLINE_REFRESH_MS = 30_000;

/**
 * While offline, refetch active queries and retry the connection every 30 s.
 * Nothing runs while the connection is live or reconnecting.
 */
export function useOfflineFallback(connection: HubConnection | null): void {
  const queryClient = useQueryClient();
  const state = useConnectionState();

  useEffect(() => {
    if (state !== 'offline') return;
    let disposed = false;

    const id = setInterval(() => {
      void queryClient.invalidateQueries();
      if (!connection || connection.state !== HubConnectionState.Disconnected) return;
      connection.start().then(
        () => {
          if (disposed) return;
          setConnectionState('live');
          void queryClient.invalidateQueries();
        },
        () => undefined, // still offline; the next tick retries
      );
    }, OFFLINE_REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(id);
    };
  }, [state, connection, queryClient]);
}
