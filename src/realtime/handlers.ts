import type { HubConnection } from '@microsoft/signalr';
import type { QueryClient } from '@tanstack/react-query';

/** Server → client events from the API contract (§7). Names are exact. */
export const HUB_EVENTS = [
  'IncidentCreated',
  'IncidentUpdated',
  'CommentAdded',
  'AppStatusChanged',
  'DashboardChanged',
  'NotificationReceived',
] as const;

export type HubEvent = (typeof HUB_EVENTS)[number];

type Handler = (payload: unknown) => void;

/**
 * Cache patching for each event. Bodies are pending D-16: the payload types (IncidentSummary, Comment,
 * DashboardSummary, AppStatusItem, AppNotification) are not in the generated schema yet, and DTOs must not be
 * hand-written. Until then every handler is a no-op, so the cache is refreshed only by the
 * `onreconnected` / offline invalidation from FE-04.01.
 */
function createHandlers(queryClient: QueryClient): Record<HubEvent, Handler> {
  void queryClient; // used by the handler bodies once D-16 is unblocked
  const pending: Handler = () => undefined;
  return {
    IncidentCreated: pending,
    IncidentUpdated: pending,
    CommentAdded: pending,
    AppStatusChanged: pending,
    DashboardChanged: pending,
    NotificationReceived: pending,
  };
}

/** Registers every event handler on the connection and returns a function that removes them all. */
export function registerHandlers(conn: HubConnection, queryClient: QueryClient): () => void {
  const handlers = createHandlers(queryClient);
  for (const event of HUB_EVENTS) conn.on(event, handlers[event]);
  return () => {
    for (const event of HUB_EVENTS) conn.off(event, handlers[event]);
  };
}
