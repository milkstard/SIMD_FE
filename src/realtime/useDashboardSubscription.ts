import { useEffect } from 'react';
import { useConnectionState } from './connectionStore';
import { invokeSafely } from './invokeSafely';
import { useSignalRConnection } from './useSignalRConnection';

/** Joins the dashboard group while mounted and live. Groups are lost on disconnect, so it re-joins on reconnect. */
export function useDashboardSubscription(): void {
  const connection = useSignalRConnection();
  const live = useConnectionState() === 'live';

  useEffect(() => {
    if (!live) return;
    invokeSafely(connection, 'JoinDashboard');
    return () => invokeSafely(connection, 'LeaveDashboard');
  }, [connection, live]);
}
