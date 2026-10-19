import type { UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/api/client';
import type { Toast } from '@/shared/toast/toastStore';
import { applyProblemErrors, getExistingIncidentNumber, problemErrorKeys } from './problemMapping';
import { reportIncidentFields, type ReportIncidentInput } from './reportIncident.schema';

export const FALLBACK_ERROR = 'The incident could not be reported. Try again.';

interface SubmitErrorTargets {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  setError: UseFormSetError<ReportIncidentInput>;
  setFormErrors: (messages: string[]) => void;
  setDuplicateNumber: (number: string) => void;
}

/**
 * Turns a failed `POST /incidents` into form errors, the duplicate notice or a toast. The draft is kept
 * in every case, so nothing here touches it.
 */
export function handleSubmitError(
  error: unknown,
  { showToast, setError, setFormErrors, setDuplicateNumber }: SubmitErrorTargets,
) {
  if (!(error instanceof ApiError)) {
    showToast({ message: FALLBACK_ERROR, severity: 'error' });
    return;
  }
  const { status, problem } = error;
  const existing = getExistingIncidentNumber(problem);

  // Server text (title/detail) is never shown: fixed copy per status, only 422 field messages come through.
  if (status === 422) {
    const unmapped = applyProblemErrors(problem, setError, reportIncidentFields);
    const mapped = problemErrorKeys(problem).some((key) => reportIncidentFields.includes(key));
    setFormErrors(unmapped.length > 0 || mapped ? unmapped : ['Check the form and try again.']);
  } else if (status === 409 && existing) {
    setDuplicateNumber(existing);
  } else if (status === 413) {
    showToast({ message: 'The report is too large to send.', severity: 'error' });
  } else if (status === 500) {
    showToast({
      message: 'Something went wrong on our side. Quote the trace ID if you contact support.',
      severity: 'error',
      traceId: problem?.traceId,
    });
  } else if (status === 403) {
    showToast({ message: 'You cannot report incidents for this application.', severity: 'error' });
  } else if (status === 429) {
    showToast({ message: 'Too many requests. Wait a moment and try again.', severity: 'warning' });
  } else {
    showToast({ message: FALLBACK_ERROR, severity: 'error' });
  }
}
