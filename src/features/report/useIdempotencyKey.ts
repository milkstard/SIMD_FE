import { useCallback, useRef } from 'react';

/**
 * One `Idempotency-Key` per submit attempt: `current()` returns the same key until `reset()`,
 * so a double-click or an unedited resubmit reuses it and the server returns the original result.
 */
export function useIdempotencyKey() {
  const key = useRef<string | null>(null);

  const current = useCallback(() => (key.current ??= crypto.randomUUID()), []);
  const reset = useCallback(() => {
    key.current = null;
  }, []);

  return { current, reset };
}
