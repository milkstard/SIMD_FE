import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { config } from '@/app/config';
import { msalInstance } from '@/app/msal';
import { useSessionStore } from '@/app/sessionStore';
import type { components } from './generated/schema';

/** Generated ProblemDetails, narrowed with the extension members the API sends (API-CONTRACT §6). */
export type ApiProblem = components['schemas']['ProblemDetails'] & {
  traceId?: string | null;
  errors?: Record<string, string[]> | null;
};

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ApiProblem | null;

  constructor(status: number, problem: ApiProblem | null) {
    super(problem?.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

/** Access token for the API; also used by the SignalR `accessTokenFactory`. */
export async function getToken(forceRefresh = false): Promise<string> {
  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes: [config.apiScope],
      account: msalInstance.getActiveAccount() ?? undefined,
      forceRefresh,
    });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) useSessionStore.getState().markExpired();
    throw error;
  }
}

function send(url: URL, init: RequestInit | undefined, token: string): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  return fetch(url, { ...init, headers });
}

async function parseProblem(response: Response): Promise<ApiProblem | null> {
  if (!response.headers.get('content-type')?.includes('json')) return null;
  try {
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null ? (body as ApiProblem) : null;
  } catch {
    return null;
  }
}

/**
 * Single fetch wrapper for the API. Adds the bearer token, retries once after a forced
 * silent refresh on 401, and throws ApiError (with the ProblemDetails body) on non-2xx.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(`${config.apiBaseUrl}${path}`, window.location.origin);

  let response = await send(url, init, await getToken(false));
  if (response.status === 401) {
    response = await send(url, init, await getToken(true));
  }

  if (!response.ok) throw new ApiError(response.status, await parseProblem(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
