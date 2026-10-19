import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { apiRequest } from '@/api/client';
import { theme } from '@/app/theme';
import { manyIncidents } from '@/test/msw/fixtures';
import IncidentListRoute from './IncidentListRoute';

// Runs in real Chromium (`npm run test:browser`): MUI disables grid virtualization under jsdom.

const TOTAL = 1200;
const PAGE = 50;
const all = manyIncidents(TOTAL);

vi.mock('@/api/client', () => ({ apiRequest: vi.fn() }));

// Counts mounts/renders of the time cell, to show a scroll tick doesn't re-render the whole window.
const timeAgoRenders = vi.hoisted(() => ({ count: 0, mounts: 0 }));
vi.mock('@/shared/TimeAgo', () => ({
  TimeAgo: ({ value }: { value?: string | null }) => {
    timeAgoRenders.count += 1;
    useEffect(() => {
      timeAgoRenders.mounts += 1;
    }, []);
    return <time dateTime={value ?? undefined}>{value}</time>;
  },
}));

const incidentCalls = () =>
  vi.mocked(apiRequest).mock.calls.filter(([path]) => path.startsWith('/incidents?'));
const cursors = () =>
  incidentCalls().map(([path]) => new URL(path, 'http://x').searchParams.get('cursor'));

beforeEach(() => {
  timeAgoRenders.count = 0;
  vi.mocked(apiRequest).mockImplementation((path: string) => {
    // The filter bar loads applications through the same client; only incidents are paged here.
    if (!path.startsWith('/incidents?')) return Promise.resolve({ items: [], nextCursor: null });
    const cursor = new URL(path, 'http://x').searchParams.get('cursor');
    const offset = cursor ? Number(cursor.replace('offset:', '')) : 0;
    const next = offset + PAGE;
    return Promise.resolve({
      items: all.slice(offset, next),
      nextCursor: next < TOTAL ? `offset:${next}` : null,
      totalCount: null,
    });
  });
});
afterEach(() => vi.clearAllMocks());

function renderList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IncidentListRoute />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

const domRows = (grid: HTMLElement) => grid.querySelectorAll('[role="row"][data-id]').length;
const scrollerOf = (grid: HTMLElement) => {
  const scroller = grid.querySelector<HTMLElement>('.MuiDataGrid-virtualScroller');
  if (!scroller) throw new Error('virtual scroller not found');
  return scroller;
};
const loadedRows = (grid: HTMLElement) => Number(grid.getAttribute('aria-rowcount')) - 1;

describe('IncidentList in a real browser', { timeout: 60_000 }, () => {
  it('renders only a window of the loaded rows', async () => {
    renderList();
    const grid = await screen.findByRole('grid', { name: 'Incidents' });
    await vi.waitFor(() => expect(domRows(grid)).toBeGreaterThan(0));

    expect(loadedRows(grid)).toBe(PAGE);
    expect(domRows(grid)).toBeLessThan(PAGE);
  });

  it('fetches the next cursor page when the scroll nears the end, and only then', async () => {
    renderList();
    const grid = await screen.findByRole('grid', { name: 'Incidents' });
    await vi.waitFor(() => expect(domRows(grid)).toBeGreaterThan(0));
    expect(cursors()).toEqual([null]);

    const scroller = scrollerOf(grid);
    scroller.scrollTop = scroller.scrollHeight;

    await vi.waitFor(() => expect(cursors()).toContain('offset:50'));
    await vi.waitFor(() => expect(loadedRows(grid)).toBe(2 * PAGE));
  });

  it('stays virtualized through 1000+ rows and stops at the end of the list', async () => {
    renderList();
    const grid = await screen.findByRole('grid', { name: 'Incidents' });
    const scroller = scrollerOf(grid);

    await vi.waitFor(
      () => {
        scroller.scrollTop = scroller.scrollHeight;
        expect(loadedRows(grid)).toBe(TOTAL);
      },
      { timeout: 45_000, interval: 50 },
    );

    expect(loadedRows(grid)).toBeGreaterThan(1000);
    expect(domRows(grid)).toBeLessThan(60);
    const requests = incidentCalls().length;
    expect(requests).toBe(TOTAL / PAGE);

    // The last page has no cursor: scrolling at the end requests nothing more.
    scroller.scrollTop = scroller.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(incidentCalls().length).toBe(requests);
  });

  it('does not re-render the whole window on a scroll tick', async () => {
    renderList();
    const grid = await screen.findByRole('grid', { name: 'Incidents' });
    await vi.waitFor(() => expect(domRows(grid)).toBeGreaterThan(0));
    const scroller = scrollerOf(grid);
    const scrollOneRow = async () => {
      scroller.scrollTop += 52;
      await new Promise((resolve) => setTimeout(resolve, 200));
    };

    // The first scroll re-mounts the window once (the grid leaves its initial layout); not a per-tick cost.
    await scrollOneRow();

    for (let tick = 0; tick < 5; tick += 1) {
      const renders = timeAgoRenders.count;
      const mounts = timeAgoRenders.mounts;
      await scrollOneRow();
      // One row scrolls into the window; the other rows keep their cells.
      expect(timeAgoRenders.mounts - mounts).toBeLessThanOrEqual(2);
      expect(timeAgoRenders.count - renders).toBeLessThanOrEqual(2);
    }
  });
});
