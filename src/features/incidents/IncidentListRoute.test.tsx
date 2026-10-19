import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { mockAuth, renderAtIncidents } from '@/test/renderWithProviders';
import IncidentListRoute from './IncidentListRoute';

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

describe('IncidentListRoute', () => {
  it('shows a skeleton, then the incidents with links, severity and status', async () => {
    renderAtIncidents(<IncidentListRoute />);

    expect(screen.getByRole('status', { name: /loading incidents/i })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Incidents' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(50);
    expect(within(list).getByRole('link', { name: 'INC-3001' })).toHaveAttribute(
      'href',
      '/incidents/INC-3001',
    );
    expect(within(list).getAllByText('Critical').length).toBeGreaterThan(0);
  });

  it('loads the next page with "Load more" and then hides the button', async () => {
    renderAtIncidents(<IncidentListRoute />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('link', { name: 'INC-3060' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
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

    expect(await screen.findByRole('list', { name: 'Incidents' })).toBeInTheDocument();
  });

  it('keeps the rows and offers Retry when the next page fails', async () => {
    server.use(
      http.get(
        '*/incidents',
        ({ request }) =>
          new URL(request.url).searchParams.has('cursor')
            ? new HttpResponse(null, { status: 500 })
            : undefined,
        { once: false },
      ),
    );
    renderAtIncidents(<IncidentListRoute />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('The next incidents could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'INC-3001' })).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('link', { name: 'INC-3060' })).toBeInTheDocument();
    expect(screen.queryByText('The next incidents could not be loaded.')).not.toBeInTheDocument();
  });

  it('keeps the rows and shows a retry when a refresh fails', async () => {
    const { queryClient } = renderAtIncidents(<IncidentListRoute />);
    await screen.findByRole('list', { name: 'Incidents' });

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
});
