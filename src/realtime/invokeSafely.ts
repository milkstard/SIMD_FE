import { HubConnectionState, type HubConnection } from '@microsoft/signalr';

/**
 * Calls a hub method without ever throwing: skipped unless the connection is connected, and a failed
 * invoke is logged instead of surfacing into render.
 */
export function invokeSafely(connection: HubConnection | null, method: string, ...args: unknown[]): void {
  if (connection?.state !== HubConnectionState.Connected) return;
  connection.invoke(method, ...args).catch((error: unknown) => {
    console.warn(`[realtime] ${method} failed`, error);
  });
}
