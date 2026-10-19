import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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

  // Same array while the cache entry is unchanged: the grid diffs `rows` by reference, so a new array on every
  // render would re-render every row after a live patch (measured in IncidentList.live.test.tsx).
  const rows = useMemo(() => query.data?.pages.flatMap((page) => page.items ?? []) ?? [], [query.data]);

  return { ...query, rows };
}
