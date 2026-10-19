import type { components } from '@/api/generated/schema';

type Schemas = components['schemas'];

/** The sort tokens the contract accepts (API-CONTRACT §5); the generated type is a plain string. */
export type IncidentSort = 'createdAt' | '-createdAt' | 'severity' | '-updatedAt';

export type IncidentFilters = {
  status?: Schemas['IncidentStatus'][];
  severity?: Schemas['Severity'][];
  applicationId?: string;
  assignee?: 'me' | 'unassigned';
  slaBreached?: boolean;
  q?: string;
  teamId?: string;
  sort?: IncidentSort;
};

export const PAGE_SIZE = 50;
export const DEFAULT_SORT: IncidentSort = '-createdAt';
/** The API answers 422 above this; the search box caps input in 06_02. */
export const MAX_QUERY_LENGTH = 200;

const nonEmpty = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const uniqueSorted = <T extends string>(values: T[] | undefined) =>
  values && values.length > 0 ? [...new Set(values)].sort() : undefined;

/**
 * Canonical form of the filters: empty values dropped, lists ordered, sort defaulted.
 * Used for both the cache key and the request, so equivalent filters share one cache entry.
 */
export function normalizeFilters(filters: IncidentFilters): IncidentFilters {
  const q = nonEmpty(filters.q);
  const normalized: IncidentFilters = { sort: filters.sort ?? DEFAULT_SORT };

  const status = uniqueSorted(filters.status);
  const severity = uniqueSorted(filters.severity);
  const applicationId = nonEmpty(filters.applicationId);
  const teamId = nonEmpty(filters.teamId);

  if (status) normalized.status = status;
  if (severity) normalized.severity = severity;
  if (applicationId) normalized.applicationId = applicationId;
  if (teamId) normalized.teamId = teamId;
  if (filters.assignee) normalized.assignee = filters.assignee;
  if (filters.slaBreached === true) normalized.slaBreached = true;
  // Over the limit the search is not sent at all, which avoids the 422.
  if (q && q.length <= MAX_QUERY_LENGTH) normalized.q = q;
  return normalized;
}

/** Query string for `GET /incidents` without a cursor (the hook adds it per page). */
export function toIncidentQuery(filters: IncidentFilters): URLSearchParams {
  const f = normalizeFilters(filters);
  const query = new URLSearchParams();

  for (const status of f.status ?? []) query.append('status', status);
  for (const severity of f.severity ?? []) query.append('severity', severity);
  if (f.applicationId) query.set('applicationId', f.applicationId);
  if (f.assignee) query.set('assigneeId', f.assignee);
  if (f.teamId) query.set('teamId', f.teamId);
  if (f.slaBreached) query.set('slaBreached', 'true');
  if (f.q) query.set('q', f.q);
  query.set('sort', f.sort ?? DEFAULT_SORT);
  query.set('limit', String(PAGE_SIZE));
  return query;
}
