import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { incidentKeys } from '@/api/keys';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { isIncidentNumber } from '@/shared/incidentPath';

export type SimilarIncident = components['schemas']['IncidentSummaryDto'];

const DEBOUNCE_MS = 400;
// The API returns [] below this length, so don't ask.
const MIN_TITLE_LENGTH = 3;
const MAX_HINTS = 5;

/** Open incidents of the application with a title like `title`; waits for the typing to pause. */
export function useSimilarIncidents(applicationId: string, title: string) {
  const debouncedTitle = useDebouncedValue(title.trim(), DEBOUNCE_MS);

  return useQuery({
    queryKey: incidentKeys.similar(applicationId, debouncedTitle),
    queryFn: () =>
      apiRequest<SimilarIncident[]>(
        `/incidents/similar?${new URLSearchParams({ applicationId, title: debouncedTitle })}`,
      ),
    enabled: applicationId !== '' && debouncedTitle.length >= MIN_TITLE_LENGTH,
    staleTime: 30_000,
    select: (items) => items.filter((item) => isIncidentNumber(item.number)).slice(0, MAX_HINTS),
  });
}
