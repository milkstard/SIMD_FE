import type { components } from '@/api/generated/schema';

export type IncidentStatus = components['schemas']['IncidentStatus'];

/** Fixed workflow words from the design system; never synonyms. */
export const STATUS_LABELS: Record<IncidentStatus, string> = {
  New: 'New',
  Triaged: 'Triaged',
  InProgress: 'In progress',
  OnHold: 'On hold',
  Resolved: 'Resolved',
  Reopened: 'Reopened',
  Closed: 'Closed',
};
