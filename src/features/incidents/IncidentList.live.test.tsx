import { act, screen, within } from '@testing-library/react';
import { http } from 'msw';
import { registerHandlers } from '@/realtime/handlers';
import { createFakeConnection } from '@/test/fakeConnection';
import { incidentSummary } from '@/test/msw/fixtures';
import { server } from '@/test/msw/server';
import { mockAuth, renderAtIncidents } from '@/test/renderWithProviders';
import IncidentListRoute from './IncidentListRoute';

// Counts renders per `updatedAt` (unique per fixture row) to show which rows were re-rendered.
const timeAgoRenders = vi.hoisted(() => new Map<string, number>());
vi.mock('@/shared/TimeAgo', () => ({
  TimeAgo: ({ value }: { value?: string | null }) => {
    timeAgoRenders.set(value ?? '', (timeAgoRenders.get(value ?? '') ?? 0) + 1);
    return <time dateTime={value ?? undefined}>{value}</time>;
  },
}));

beforeEach(() => {
  mockAuth();
  timeAgoRenders.clear();
});
afterEach(() => vi.restoreAllMocks());

const rowNumbers = (grid: HTMLElement) =>
  within(grid)
    .getAllByRole('row')
    .slice(1)
    .map((row) => /INC-\d+/.exec(row.textContent ?? '')?.[0]);

describe('incident grid live updates', { timeout: 20_000 }, () => {
  it('patches one row in place without reordering, re-rendering or refetching the others', async () => {
    let requests = 0;
    server.use(
      http.get('*/incidents', () => {
        requests += 1;
        return undefined;
      }),
    );
    const { connection, emit } = createFakeConnection();
    const { queryClient } = renderAtIncidents(<IncidentListRoute />);
    registerHandlers(connection, queryClient);
    const grid = await screen.findByRole('grid', { name: 'Incidents' });
    await within(grid).findByRole('link', { name: 'INC-3050' });
    expect(requests).toBe(1);

    const before = rowNumbers(grid);
    const rendersBefore = new Map(timeAgoRenders);
    const target = incidentSummary(2); // INC-3003, "List incident 3", InProgress
    expect(within(grid).getByText('List incident 3')).toBeInTheDocument();

    act(() =>
      emit('IncidentUpdated', {
        ...target,
        title: 'Edited live',
        status: 'Resolved',
        updatedAt: '2026-10-19T09:00:00.000Z',
      }),
    );

    expect(await within(grid).findByText('Edited live')).toBeInTheDocument();
    expect(within(grid).queryByText('List incident 3')).not.toBeInTheDocument();
    const row = within(grid).getByRole('row', { name: /INC-3003/ });
    expect(within(row).getByText('Resolved')).toBeInTheDocument();
    expect(rowNumbers(grid)).toEqual(before);
    // No refetch: the cache patch alone updated the row.
    expect(requests).toBe(1);

    // Only the patched row's time cell re-rendered; every other row kept its render count.
    for (const [updatedAt, count] of rendersBefore) {
      expect(timeAgoRenders.get(updatedAt)).toBe(count);
    }
    expect(timeAgoRenders.get('2026-10-19T09:00:00.000Z')).toBeGreaterThan(0);
  });

  it('ignores an event older than the cached row', async () => {
    const { connection, emit } = createFakeConnection();
    const { queryClient } = renderAtIncidents(<IncidentListRoute />);
    registerHandlers(connection, queryClient);
    const grid = await screen.findByRole('grid', { name: 'Incidents' });
    await within(grid).findByRole('link', { name: 'INC-3001' });

    act(() =>
      emit('IncidentUpdated', {
        ...incidentSummary(0),
        title: 'Stale',
        updatedAt: '2000-01-01T00:00:00Z',
      }),
    );

    expect(within(grid).getByText('List incident 1')).toBeInTheDocument();
    expect(within(grid).queryByText('Stale')).not.toBeInTheDocument();
  });
});
