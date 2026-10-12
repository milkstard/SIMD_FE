import { useEffect } from 'react';
import { useConnectionState } from './connectionStore';
import { invokeSafely } from './invokeSafely';
import { useSignalRConnection } from './useSignalRConnection';

/** Watches one incident while mounted and live; re-watches after a reconnect. No-op without an id. */
export function useWatchIncident(incidentId: string | undefined): void {
  const connection = useSignalRConnection();
  const live = useConnectionState() === 'live';

  useEffect(() => {
    if (!live || !incidentId) return;
    invokeSafely(connection, 'WatchIncident', incidentId);
    return () => invokeSafely(connection, 'UnwatchIncident', incidentId);
  }, [connection, live, incidentId]);
}
