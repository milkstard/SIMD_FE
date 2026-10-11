import type { RequestHandler } from 'msw';

// Shared default handlers. GET /api/v1/me is added once BE-11 ships (FE-02.02 useCurrentUser).
export const handlers: RequestHandler[] = [];
