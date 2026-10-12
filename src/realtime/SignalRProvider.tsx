import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { setConnectionState } from './connectionStore';
import { createConnection } from './createConnection';
import { SignalRContext } from './useSignalRConnection';
import { useOfflineFallback } from './useOfflineFallback';

/**
 * Owns the app's single SignalR connection while mounted (inside AuthGuard, so only for a
 * signed-in user) and mirrors its lifecycle into the connection store.
 */
export function SignalRProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  const [connection] = useState(createConnection);
  // SignalR has no way to remove lifecycle callbacks, so they are registered once and read `active`.
  const registered = useRef(false);
  const active = useRef(false);
  // A StrictMode remount must not start a connection that is still stopping.
  const stopping = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    let disposed = false;
    active.current = true;

    if (!registered.current) {
      registered.current = true;
      connection.onreconnecting(() => {
        if (active.current) setConnectionState('reconnecting');
      });
      connection.onreconnected(() => {
        if (!active.current) return;
        setConnectionState('live');
        void queryClientRef.current.invalidateQueries();
      });
      connection.onclose(() => {
        if (active.current) setConnectionState('offline');
      });
    }

    setConnectionState('reconnecting');
    void stopping.current
      .then(() => (disposed ? undefined : connection.start()))
      .then(
        () => {
          if (!disposed) setConnectionState('live');
        },
        () => {
          if (!disposed) setConnectionState('offline');
        },
      );

    return () => {
      disposed = true;
      active.current = false;
      stopping.current = connection.stop().catch(() => undefined);
      setConnectionState('offline');
    };
  }, [connection]);

  useOfflineFallback(connection);

  return <SignalRContext.Provider value={connection}>{children}</SignalRContext.Provider>;
}
