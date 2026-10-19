import type { CurrentUser } from '@/shared/hooks/useCurrentUser';
import type { IncidentFilters } from './incidentFilters';

export type SavedViewId = 'mine' | 'team' | 'unassigned' | 'slaAtRisk';

export interface SavedView {
  id: SavedViewId;
  label: string;
  /** The filters the view selects; `null` when the view is unavailable for this user. */
  filters: (user: CurrentUser | undefined) => IncidentFilters | null;
}

/**
 * The four fixed views. The API has no "at risk" filter, so "SLA at risk" maps to `slaBreached`
 * (deferred item D-29).
 */
export const SAVED_VIEWS: readonly SavedView[] = [
  { id: 'mine', label: 'My incidents', filters: () => ({ assignee: 'me' }) },
  {
    id: 'team',
    label: 'My team',
    // `teamIds` is sorted ascending by the API; the first team is the view's team.
    filters: (user) => {
      const teamId = user?.teamIds?.[0];
      return teamId ? { teamId } : null;
    },
  },
  { id: 'unassigned', label: 'Unassigned', filters: () => ({ assignee: 'unassigned' }) },
  { id: 'slaAtRisk', label: 'SLA at risk', filters: () => ({ slaBreached: true }) },
];
