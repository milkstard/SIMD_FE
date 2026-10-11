import { InteractionRequiredAuthError, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';
import { http, HttpResponse } from 'msw';
import { config } from '@/app/config';
import { msalInstance } from '@/app/msal';
import { useSessionStore } from '@/app/sessionStore';
import { server } from '@/test/msw/server';
import { ApiError, apiRequest } from './client';

const url = `${window.location.origin}${config.apiBaseUrl}/ping`;
const account = { homeAccountId: 'home-1' } as AccountInfo;
const tokenResult = (accessToken: string) => ({ accessToken }) as AuthenticationResult;

function mockTokens(...tokens: string[]) {
  const spy = vi.spyOn(msalInstance, 'acquireTokenSilent');
  tokens.forEach((token) => spy.mockResolvedValueOnce(tokenResult(token)));
  return spy;
}

/** Records the Authorization header of every request that reaches the server. */
function respondWith(...responses: (() => Response)[]) {
  const auth: (string | null)[] = [];
  let call = 0;
  server.use(
    http.get(url, ({ request }) => {
      auth.push(request.headers.get('Authorization'));
      const respond = responses[Math.min(call++, responses.length - 1)];
      return respond();
    }),
  );
  return auth;
}

const problem = (status: number, body: object) => () =>
  HttpResponse.json(body, { status, headers: { 'Content-Type': 'application/problem+json' } });

beforeEach(() => {
  vi.spyOn(msalInstance, 'getActiveAccount').mockReturnValue(account);
  useSessionStore.getState().reset();
});

afterEach(() => vi.restoreAllMocks());

describe('apiRequest', () => {
  it('sends the bearer token to the API base URL and returns the JSON body', async () => {
    const tokens = mockTokens('token-1');
    const auth = respondWith(() => HttpResponse.json({ ok: true }));

    await expect(apiRequest('/ping')).resolves.toEqual({ ok: true });

    expect(auth).toEqual(['Bearer token-1']);
    expect(tokens).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: [config.apiScope], account, forceRefresh: false }),
    );
  });

  it('refreshes the token and retries once after a 401', async () => {
    const tokens = mockTokens('token-1', 'token-2');
    const auth = respondWith(
      () => new HttpResponse(null, { status: 401 }),
      () => HttpResponse.json({ ok: true }),
    );

    await expect(apiRequest('/ping')).resolves.toEqual({ ok: true });

    expect(tokens).toHaveBeenLastCalledWith(expect.objectContaining({ forceRefresh: true }));
    expect(auth).toEqual(['Bearer token-1', 'Bearer token-2']);
  });

  it('throws a typed 401 error when the retry also fails, without a third request', async () => {
    mockTokens('token-1', 'token-2');
    const auth = respondWith(problem(401, { title: 'Unauthorized', status: 401 }));

    const error = await apiRequest('/ping').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401 });
    expect(auth).toHaveLength(2);
  });

  it.each([
    [422, { title: 'Validation failed', status: 422, errors: { title: ['Title is required.'] } }],
    [500, { title: 'Unexpected error', status: 500, traceId: '00-4bf92f35-01' }],
  ])('exposes ProblemDetails on a %i response', async (status, body) => {
    mockTokens('token-1');
    respondWith(problem(status, body));

    const error = await apiRequest('/ping').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status, problem: body, message: body.title });
  });

  it('has a null problem when the error body is not JSON', async () => {
    mockTokens('token-1');
    respondWith(() => new HttpResponse('Bad gateway', { status: 502 }));

    await expect(apiRequest('/ping')).rejects.toMatchObject({ status: 502, problem: null });
  });

  it('resolves undefined for 204', async () => {
    mockTokens('token-1');
    respondWith(() => new HttpResponse(null, { status: 204 }));

    await expect(apiRequest('/ping')).resolves.toBeUndefined();
  });

  it('flags the session as expired when the silent refresh needs interaction', async () => {
    vi.spyOn(msalInstance, 'acquireTokenSilent').mockRejectedValue(
      new InteractionRequiredAuthError('interaction_required', 'corr-1'),
    );
    const auth = respondWith(() => HttpResponse.json({}));

    await expect(apiRequest('/ping')).rejects.toBeInstanceOf(InteractionRequiredAuthError);

    expect(auth).toHaveLength(0);
    expect(useSessionStore.getState().expired).toBe(true);
  });
});
