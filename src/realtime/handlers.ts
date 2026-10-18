import type { HubConnection } from '@microsoft/signalr';
import type { QueryClient } from '@tanstack/react-query';
import { dashboardKeys, incidentKeys } from '@/api/keys';
import type { components } from '@/api/generated/schema';

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

type Schemas = components['schemas'];
type IncidentSummary = Schemas['IncidentSummaryDto'];
type IncidentDetail = Schemas['IncidentDetailDto'];
type AppStatusItem = Schemas['AppStatusItemDto'];

// Payloads come from the server (contract §7); each handler narrows its own event's payload type.
type Handler = (payload: unknown) => void;
type PagedIncidents = { items?: IncidentSummary[] | null };

const isStale = (cachedAt?: string, incomingAt?: string) =>
  cachedAt !== undefined && incomingAt !== undefined && Date.parse(cachedAt) > Date.parse(incomingAt);

/** Merges an incoming summary into a cached one unless the cache is already newer. */
function mergeSummary<T extends IncidentSummary>(cached: T, incoming: IncidentSummary): T {
  return isStale(cached.updatedAt, incoming.updatedAt) ? cached : { ...cached, ...incoming };
}

/** Patches one incident inside a cached list, which is either a single page or infinite-query pages. */
function patchList(data: unknown, incoming: IncidentSummary): unknown {
  const patchPage = (page: PagedIncidents): PagedIncidents => ({
    ...page,
    items: page.items?.map((item) => (item.id === incoming.id ? mergeSummary(item, incoming) : item)),
  });
  if (data && typeof data === 'object' && 'pages' in data && Array.isArray(data.pages)) {
    return { ...data, pages: (data.pages as PagedIncidents[]).map(patchPage) };
  }
  return data && typeof data === 'object' ? patchPage(data as PagedIncidents) : data;
}

/**
 * Cache patching for each event (spec FE-04.02). Handlers only touch entries that already exist.
 * CommentAdded and NotificationReceived stay no-ops until the backend swagger publishes their payload types (D-16).
 */
function createHandlers(queryClient: QueryClient): Record<HubEvent, Handler> {
  const pending: Handler = () => undefined;
  return {
    IncidentCreated: () => {
      // List filters are screen-defined, so refetch active lists and summaries instead of guessing a match.
      void queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summaries() });
    },
    IncidentUpdated: (payload) => {
      const incident = payload as IncidentSummary;
      if (incident.number) {
        queryClient.setQueryData<IncidentDetail>(incidentKeys.detail(incident.number), (cached) =>
          cached ? mergeSummary(cached, incident) : cached,
        );
      }
      queryClient.setQueriesData({ queryKey: incidentKeys.lists() }, (cached) =>
        cached ? patchList(cached, incident) : cached,
      );
    },
    CommentAdded: pending,
    AppStatusChanged: (payload) => {
      const item = payload as AppStatusItem;
      queryClient.setQueryData<AppStatusItem[]>(dashboardKeys.appStatus(), (cached) =>
        cached?.map((existing) => (existing.application?.id === item.application?.id ? item : existing)),
      );
    },
    // The payload is the owning team's 7d summary, but the viewer's summary spans all their teams (contract §7).
    DashboardChanged: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summaries() });
    },
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
