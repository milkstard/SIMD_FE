import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw/server';
import { checkoutApp } from '@/test/msw/fixtures';
import { mockAuth, renderAtReport } from '@/test/renderWithProviders';
import ReportRoute from './ReportRoute';

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

describe('ReportRoute', () => {
  it('shows a skeleton while the applications load, then the form', async () => {
    renderAtReport(<ReportRoute />);

    expect(screen.getByRole('status', { name: /loading the report form/i })).toBeInTheDocument();
    expect(await screen.findByRole('form', { name: /report an incident/i })).toBeInTheDocument();
  });

  it('shows an empty state when the user has no applications', async () => {
    server.use(http.get('*/applications', () => HttpResponse.json({ items: [], nextCursor: null })));
    renderAtReport(<ReportRoute />);

    expect(await screen.findByText('No applications available')).toBeInTheDocument();
  });

  it('shows an inline retry when loading fails', async () => {
    server.use(http.get('*/applications', () => new HttpResponse(null, { status: 500 })));
    renderAtReport(<ReportRoute />);
    expect(await screen.findByText('The applications could not be loaded.')).toBeInTheDocument();

    server.use(
      http.get('*/applications', () => HttpResponse.json({ items: [checkoutApp], nextCursor: null })),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('form', { name: /report an incident/i })).toBeInTheDocument();
  });

  it('follows the cursor to load every application', async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get('*/applications', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        cursors.push(cursor);
        return HttpResponse.json(
          cursor
            ? { items: [{ ...checkoutApp, id: 'second', name: 'Second app' }], nextCursor: null }
            : { items: [checkoutApp], nextCursor: 'page-2' },
        );
      }),
    );
    renderAtReport(<ReportRoute />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('combobox', { name: /^application/i }));

    expect(await screen.findByRole('option', { name: /second app/i })).toBeInTheDocument();
    expect(cursors).toEqual([null, 'page-2']);
  });

  it('keeps the skeleton while /me is pending', async () => {
    server.use(http.get('*/me', () => new Promise<Response>(() => undefined)));
    renderAtReport(<ReportRoute />);
    await screen.findByRole('status', { name: /loading the report form/i });
    await new Promise((resolve) => setTimeout(resolve, 300)); // applications have loaded by now

    expect(screen.getByRole('status', { name: /loading the report form/i })).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: /report an incident/i })).not.toBeInTheDocument();
  });

  it('still shows the form when /me fails', async () => {
    server.use(http.get('*/me', () => new HttpResponse(null, { status: 500 })));
    renderAtReport(<ReportRoute />);

    expect(await screen.findByRole('form', { name: /report an incident/i })).toBeInTheDocument();
  });
});
