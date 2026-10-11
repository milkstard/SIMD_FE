import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

const MAX_RETRIES = 2;

/** Client errors (4xx) won't fix themselves; retry only server/network failures. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();
