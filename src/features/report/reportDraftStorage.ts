// Plain storage helpers (no zod/React) so the sign-in flow can check for a draft without pulling in the form.
const VERSION = 1;
/** A draft nobody came back to is removed, so incident text doesn't linger on a shared device. */
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const draftKey = (userId: string) => `incidenthub:report-draft:${userId}`;

interface Envelope {
  v: number;
  savedAt?: number;
  values: unknown;
}

/** The stored envelope, or null when there is none, it is unreadable, from another version or too old. */
function readEnvelope(userId: string): Envelope | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId));
    if (raw === null) return null;
    const envelope = JSON.parse(raw) as Envelope | null;
    const expired = typeof envelope?.savedAt === 'number' && Date.now() - envelope.savedAt > DRAFT_MAX_AGE_MS;
    if (envelope?.v !== VERSION || expired) {
      removeDraft(userId);
      return null;
    }
    return envelope;
  } catch {
    // Storage blocked or corrupt JSON: the form works without a draft.
    removeDraft(userId);
    return null;
  }
}

/** The saved values, or null when there is no usable draft. */
export function readDraft(userId: string): unknown {
  return readEnvelope(userId)?.values ?? null;
}

export function writeDraft(userId: string, values: unknown): void {
  try {
    const envelope: Envelope = { v: VERSION, savedAt: Date.now(), values };
    window.localStorage.setItem(draftKey(userId), JSON.stringify(envelope));
  } catch {
    // Storage full or blocked: skip the save.
  }
}

export function removeDraft(userId: string): void {
  try {
    window.localStorage.removeItem(draftKey(userId));
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

export function hasReportDraft(userId: string): boolean {
  return readEnvelope(userId) !== null;
}
