import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { applicationKeys } from '@/api/keys';

export type Application = components['schemas']['ApplicationDto'];

const PAGE_SIZE = 100;

/** The API already limits non-Admins to their teams' applications; follows cursors to load them all. */
async function fetchApplications(): Promise<Application[]> {
  const applications: Application[] = [];
  let cursor: string | null = null;

  do {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) query.set('cursor', cursor);
    const page: components['schemas']['ApplicationDtoPaged'] = await apiRequest(
      `/applications?${query}`,
    );
    applications.push(...(page.items ?? []));
    cursor = page.nextCursor ?? null;
  } while (cursor);

  return applications;
}

export function useApplications() {
  return useQuery({ queryKey: applicationKeys.list({}), queryFn: fetchApplications });
}
