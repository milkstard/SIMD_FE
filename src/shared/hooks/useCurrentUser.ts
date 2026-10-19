import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { meKeys } from '@/api/keys';

export type CurrentUser = components['schemas']['CurrentUserDto'];

/**
 * `GET /me`: the signed-in user's id, roles and teams. Kept for the whole session: roles come from
 * the token's group mapping and only change on the next sign-in.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: meKeys.current(),
    queryFn: () => apiRequest<CurrentUser>('/me'),
    staleTime: Infinity,
    gcTime: Infinity,
    // Every consumer mounts its own observer: refetching a failed query on each mount would flip it back to
    // pending and make a screen that waits for the user flicker between skeleton and content.
    retryOnMount: false,
  });
}
