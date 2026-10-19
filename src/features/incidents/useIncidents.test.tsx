import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { incidentKeys } from '@/api/keys';
import { listIncidents } from '@/test/msw/fixtures';
import { server } from '@/test/msw/server';
import { mockAuth } from '@/test/renderWithProviders';
import { normalizeFilters, type IncidentFilters } from './incidentFilters';
import { useIncidents } from './useIncidents';

beforeEach(mockAuth);
afterEach(() => {
  vi.restoreAllMocks();
  server.events.removeAllListeners();
});

function setup(initial: IncidentFilters) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook((filters: IncidentFilters) => useIncidents(filters), {
    initialProps: initial,
    wrapper,
  });
  return { ...hook, queryClient };
}

function recordRequests() {
  const urls: URL[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/incidents')) urls.push(url);
  });
  return urls;
}

describe('useIncidents', () => {
  it('loads the first page and exposes flattened rows', async () => {
    const { result } = setup({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.rows).toHaveLength(50);
    expect(result.current.rows[0].number).toBe('INC-3001');
    expect(result.current.hasNextPage).toBe(true);
  });

  it('sends the previous nextCursor and stops at the last page', async () => {
    const urls = recordRequests();
    const { result } = setup({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.rows).toHaveLength(listIncidents.length));
    expect(urls.map((url) => url.searchParams.get('cursor'))).toEqual([null, 'offset:50']);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('starts again from no cursor when the filters change', async () => {
    const urls = recordRequests();
    const { result, rerender } = setup({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.rows).toHaveLength(listIncidents.length));

    rerender({ severity: ['Critical'] });

    await waitFor(() => expect(result.current.rows.length).toBeGreaterThan(0));
    expect(result.current.rows.every((row) => row.severity === 'Critical')).toBe(true);
    const last = urls[urls.length - 1];
    expect(last.searchParams.has('cursor')).toBe(false);
    expect(last.searchParams.getAll('severity')).toEqual(['Critical']);
  });

  it('keeps the data under the normalized list key', async () => {
    const { result, queryClient } = setup({ status: [], q: '' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(incidentKeys.list(normalizeFilters({})))).toBeDefined();
  });

  it('does not poll', async () => {
    const urls = recordRequests();
    const { result } = setup({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    vi.useFakeTimers();
    try {
      await vi.advanceTimersByTimeAsync(120_000);
    } finally {
      vi.useRealTimers();
    }

    expect(urls).toHaveLength(1);
  });

  it('sends assignee, SLA and search filters on the wire', async () => {
    const urls = recordRequests();
    const { result } = setup({ assignee: 'me', slaBreached: true, q: 'list' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const params = urls[0].searchParams;
    expect(params.get('assigneeId')).toBe('me');
    expect(params.get('slaBreached')).toBe('true');
    expect(params.get('q')).toBe('list');
  });

  it('does not send a search over 200 characters, so there is no 422', async () => {
    const urls = recordRequests();
    const { result } = setup({ q: 'a'.repeat(201) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(urls[0].searchParams.has('q')).toBe(false);
    expect(result.current.rows).toHaveLength(50);
  });

  it('surfaces a failed first load', async () => {
    server.use(http.get('*/incidents', () => new HttpResponse(null, { status: 500 })));
    const { result } = setup({});
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.rows).toEqual([]);
  });
});
