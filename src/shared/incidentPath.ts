const INCIDENT_NUMBER = /^INC-\d+$/;

/** Display numbers come from the API (`INC-1042`); check the format before building a route from one. */
export function isIncidentNumber(value: unknown): value is string {
  return typeof value === 'string' && INCIDENT_NUMBER.test(value);
}

export function incidentPath(number: string): string {
  return `/incidents/${encodeURIComponent(number)}`;
}
