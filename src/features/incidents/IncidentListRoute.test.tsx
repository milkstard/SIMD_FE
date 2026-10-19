import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { mockAuth, renderAtIncidents } from '@/test/renderWithProviders';
import IncidentListRoute from './IncidentListRoute';

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

// jsdom has no layout, so the grid never reports a scroll position: paging on scroll is covered in
// IncidentList.browser.test.tsx. Grid rendering is also slow under full-suite load.
describe('IncidentListRoute', { timeout: 20_000 }, () => {
  it('shows a skeleton, then the grid with links, severity and status', async () => {
    renderAtIncidents(<IncidentListRoute />);

    expect(screen.getByRole('status', { name: /loading incidents/i })).toBeInTheDocument();
    const grid = await screen.findByRole('grid', { name: 'Incidents' });
    expect(await within(grid).findByRole('link', { name: 'INC-3001' })).toHaveAttribute(
      'href',
      '/incidents/INC-3001',
    );
    expect(within(grid).getAllByText('Critical').length).toBeGreaterThan(0);
  });

  it('shows an empty state when nothing is returned', async () => {
    server.use(http.get('*/incidents', () => HttpResponse.json({ items: [], nextCursor: null })));
    renderAtIncidents(<IncidentListRoute />);

    expect(await screen.findByText('No incidents match')).toBeInTheDocument();
  });

  it('shows an inline retry after a failure and recovers', async () => {
    server.use(http.get('*/incidents', () => new HttpResponse(null, { status: 500 }), { once: true }));
    renderAtIncidents(<IncidentListRoute />);
    expect(await screen.findByText('The incidents could not be loaded.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('grid', { name: 'Incidents' })).toBeInTheDocument();
  });

  it('keeps the rows and shows a retry when a refresh fails', async () => {
    const { queryClient } = renderAtIncidents(<IncidentListRoute />);
    await screen.findByRole('grid', { name: 'Incidents' });

    server.use(http.get('*/incidents', () => new HttpResponse(null, { status: 500 })));
    await act(() => queryClient.invalidateQueries());

    expect(await screen.findByText('The incidents could not be refreshed.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'INC-3001' })).toBeInTheDocument();

    server.resetHandlers();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.queryByText('The incidents could not be refreshed.')).not.toBeInTheDocument(),
    );
  });

  it('sorts on the server from the Severity header and returns to the default order', async () => {
    const sorts: (string | null)[] = [];
    server.use(
      http.get('*/incidents', ({ request }) => {
        sorts.push(new URL(request.url).searchParams.get('sort'));
        return undefined;
      }),
    );
    renderAtIncidents(<IncidentListRoute />);
    const user = userEvent.setup();
    await screen.findByRole('grid', { name: 'Incidents' });

    await user.click(screen.getByRole('columnheader', { name: /severity/i }));
    await waitFor(() => expect(sorts).toContain('severity'));

    await user.click(screen.getByRole('columnheader', { name: /severity/i }));
    await waitFor(() => expect(sorts[sorts.length - 1]).toBe('-createdAt'));
  });
});
