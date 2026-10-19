import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { incidentKeys } from '@/api/keys';
import { normalizeFilters, toIncidentQuery, type IncidentFilters } from './incidentFilters';

export type IncidentRow = components['schemas']['IncidentSummaryDto'];
type IncidentPage = components['schemas']['IncidentSummaryDtoPaged'];

/**
 * Cursor-paged incident list. The cache keeps the `{ pages }` shape that `realtime/handlers.ts` patches,
 * so `IncidentUpdated` reaches the rows without a refetch. No polling here: the offline fallback owns that.
 */
export function useIncidents(filters: IncidentFilters) {
  // A changed filter or sort is a different key, so the new list starts from no cursor.
  const normalized = normalizeFilters(filters);

  const query = useInfiniteQuery({
    queryKey: incidentKeys.list(normalized),
    queryFn: ({ pageParam, signal }) => {
      const params = toIncidentQuery(normalized);
      if (pageParam) params.set('cursor', pageParam);
      return apiRequest<IncidentPage>(`/incidents?${params}`, { signal });
    },
    initialPageParam: null as string | null,
    // `null` = last page: undefined stops further fetching.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const rows = query.data?.pages.flatMap((page) => page.items ?? []) ?? [];

  return { ...query, rows };
}
