import { ApiError } from '@/api/client';
import { shouldRetry } from './queryClient';

describe('shouldRetry', () => {
  it('never retries client errors', () => {
    expect(shouldRetry(0, new ApiError(404, null))).toBe(false);
    expect(shouldRetry(0, new ApiError(422, null))).toBe(false);
  });

  it('retries server and network errors up to twice', () => {
    expect(shouldRetry(0, new ApiError(500, null))).toBe(true);
    expect(shouldRetry(1, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetry(2, new ApiError(500, null))).toBe(false);
  });
});
