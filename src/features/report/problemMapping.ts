import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import type { ApiProblem } from '@/api/client';
import { isIncidentNumber } from '@/shared/incidentPath';

/** `errors` comes from the network, so check its shape instead of trusting the `ApiProblem` cast. */
function readErrors(problem: ApiProblem | null): [string, string[]][] {
  const errors: unknown = problem?.errors;
  if (typeof errors !== 'object' || errors === null || Array.isArray(errors)) return [];

  return Object.entries(errors).map(([key, value]) => [
    key,
    (Array.isArray(value) ? value : [value]).filter((m) => m != null).map(String),
  ]);
}

/** Field names the 422 `errors` object refers to. */
export function problemErrorKeys(problem: ApiProblem | null): string[] {
  return readErrors(problem).map(([key]) => key);
}

/**
 * Maps `ProblemDetails.errors` (camelCase keys = form field names) onto the form with `setError`.
 * Returns the messages of keys that match no field, for a form-level alert.
 */
export function applyProblemErrors<T extends FieldValues>(
  problem: ApiProblem | null,
  setError: UseFormSetError<T>,
  fields: readonly string[],
): string[] {
  const unmapped: string[] = [];

  for (const [key, messages] of readErrors(problem)) {
    if (fields.includes(key)) {
      setError(key as FieldPath<T>, { type: 'server', message: messages.join(' ') });
    } else {
      unmapped.push(...messages);
    }
  }
  return unmapped;
}

/** `existingIncidentNumber` extension of the 409 "Duplicate incident" problem (API-CONTRACT §6). */
export function getExistingIncidentNumber(problem: ApiProblem | null): string | null {
  const value: unknown = problem?.existingIncidentNumber;
  return isIncidentNumber(value) ? value : null;
}
