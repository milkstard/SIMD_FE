import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '@/test/msw/server';
import { similarIncidents } from '@/test/msw/fixtures';
import { mockAuth } from '@/test/renderWithProviders';
import { useSimilarIncidents } from './useSimilarIncidents';

const APP_ID = 'b3f1c1f0-0000-4000-8000-000000000001';

beforeEach(mockAuth);
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function setup(initial: { applicationId: string; title: string }) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get('*/incidents/similar', ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(similarIncidents);
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(({ applicationId, title }) => useSimilarIncidents(applicationId, title), {
    wrapper,
    initialProps: initial,
  });
  return { ...hook, requests };
}

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe('useSimilarIncidents', () => {
  it('sends one request with the last title after a 400 ms pause', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result, rerender, requests } = setup({ applicationId: APP_ID, title: '' });

    for (const title of ['Che', 'Chec', 'Checko', 'Checkout']) {
      await advance(100);
      rerender({ applicationId: APP_ID, title });
    }
    await advance(300);
    expect(requests).toHaveLength(0);

    await advance(100);
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(requests).toHaveLength(1);
    expect(requests[0].get('title')).toBe('Checkout');
    expect(requests[0].get('applicationId')).toBe(APP_ID);
  });

  it('returns at most five matches', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = setup({ applicationId: APP_ID, title: 'Checkout' });

    await advance(400);
    await waitFor(() => expect(result.current.data).toHaveLength(5));
  });

  it.each([
    ['no application', '', 'Checkout fails'],
    ['a title under 3 characters', APP_ID, 'ab'],
    ['a title that is short once trimmed', APP_ID, '  ab  '],
  ])('makes no request with %s', async (_label, applicationId, title) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { requests } = setup({ applicationId, title });

    await advance(1000);

    expect(requests).toHaveLength(0);
  });
});
