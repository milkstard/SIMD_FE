import { useCallback, useEffect, useRef, useState } from 'react';
import { useWatch, type UseFormReset } from 'react-hook-form';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import type { ReportControl } from './reportFormTypes';
import {
  REPORT_DEFAULTS,
  reportDraftFields,
  reportDraftSchema,
  type ReportDraft,
  type ReportIncidentInput,
} from './reportIncident.schema';
import { readDraft, removeDraft, writeDraft } from './reportDraftStorage';
import type { Application } from './useApplications';

const SAVE_DELAY_MS = 500;

/** Only the typed fields, and only the non-empty ones; `{}` means there is nothing worth saving. */
function pickDraft(values: Partial<ReportIncidentInput>): ReportDraft {
  const draft: ReportDraft = {};
  for (const field of reportDraftFields) {
    const value = values[field];
    if (typeof value === 'string' && value !== '') Object.assign(draft, { [field]: value });
  }
  return draft;
}

function omit(draft: ReportDraft, ...keys: (keyof ReportDraft)[]): ReportDraft {
  return Object.fromEntries(
    Object.entries(draft).filter(([key]) => !keys.includes(key as keyof ReportDraft)),
  );
}

/** Drops an application (and its environment) that is gone, and an environment it no longer offers. */
function dropStale(draft: ReportDraft, applications: Application[]): ReportDraft {
  const application = applications.find((candidate) => candidate.id === draft.applicationId);
  if (!application) return omit(draft, 'applicationId', 'environment');
  if (draft.environment && !application.environments?.includes(draft.environment)) {
    return omit(draft, 'environment');
  }
  return draft;
}

interface UseReportDraftOptions {
  control: ReportControl;
  reset: UseFormReset<ReportIncidentInput>;
  applications: Application[];
}

/** Writes the typed fields, or removes the draft when nothing is left. Returns whether a draft is stored. */
function persist(userId: string, values: Partial<ReportIncidentInput>): boolean {
  const draft = pickDraft(values);
  if (Object.keys(draft).length === 0) {
    removeDraft(userId);
    return false;
  }
  writeDraft(userId, draft);
  return true;
}

/**
 * Keeps the report form in `localStorage` for the signed-in user: restores it once on mount, saves
 * after typing pauses (and when the form unmounts mid-pause). Nothing is read or written until the
 * user is known, and every storage failure is swallowed so the form works without a draft.
 *
 * Refs: `restoredFor` = user whose draft was already read (restore runs once per user); `untouched` =
 * the pristine form values, never saved; `cleared` = the draft was submitted or discarded, so no later
 * save may bring it back (the form unmounts or remounts after both, so it is never reset);
 * `latest` = what the unmount save needs.
 */
export function useReportDraft({ control, reset, applications }: UseReportDraftOptions) {
  const userId = useCurrentUser().data?.id;
  const values = useWatch({ control });
  const debounced = useDebouncedValue(values, SAVE_DELAY_MS);
  const [restored, setRestored] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const restoredFor = useRef<string | null>(null);
  const cleared = useRef(false);
  // The untouched form must never be saved: it would erase the draft before (or right after) it is restored,
  // also when the user becomes known after the form has mounted.
  const untouched = useRef(values);
  const latest = useRef({ userId, values, pending: false });
  useEffect(() => {
    latest.current = { userId, values, pending: values !== debounced };
  });

  // One-time read of external storage into the form (and the notice state), once the user is known.
  const restore = useCallback(
    (id: string) => {
      restoredFor.current = id;
      // Typing started before the user was known: don't overwrite it, the next save replaces the old draft.
      if (latest.current.values !== untouched.current) return;
      const saved = readDraft(id);
      if (saved === null) return;
      const parsed = reportDraftSchema.safeParse(saved);
      const draft = parsed.success ? dropStale(parsed.data, applications) : {};
      if (Object.keys(draft).length === 0) {
        removeDraft(id); // corrupt, outdated or nothing left after dropping stale values
        return;
      }
      reset({ ...REPORT_DEFAULTS, ...draft });
      setRestored(true);
      setHasDraft(true);
    },
    [applications, reset],
  );

  useEffect(() => {
    if (userId && restoredFor.current !== userId) restore(userId);
  }, [userId, restore]);

  useEffect(() => {
    if (debounced === untouched.current) return;
    if (!userId || restoredFor.current !== userId || cleared.current) return;
    setHasDraft(persist(userId, debounced));
  }, [debounced, userId]);

  // Typing from the last pause would be lost when the form goes away (e.g. the session expires).
  useEffect(
    () => () => {
      const { userId: id, values: current, pending } = latest.current;
      if (id && pending && !cleared.current) persist(id, current);
    },
    [],
  );

  const clear = useCallback(() => {
    cleared.current = true;
    if (userId) removeDraft(userId);
    setHasDraft(false);
    setRestored(false);
  }, [userId]);

  const dismissRestored = useCallback(() => setRestored(false), []);

  return { values, restored, dismissRestored, hasDraft, clear };
}
