import { InteractionStatus, type AccountInfo } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { setConnectionState } from '@/realtime/connectionStore';
import { currentUser } from '@/test/msw/fixtures';
import { server } from '@/test/msw/server';
import { mockAuth } from '@/test/renderWithProviders';
import { routes } from '../routes';
import { theme } from '../theme';

vi.mock('@azure/msal-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@azure/msal-react')>()),
  useMsal: vi.fn(),
}));

const account: AccountInfo = {
  homeAccountId: 'home-1',
  environment: 'login.microsoftonline.com',
  tenantId: 'tenant-1',
  username: 'ana.reyes@corp.example',
  localAccountId: 'local-1',
  name: 'Ana Reyes',
};

function renderAt(path: string, activeAccount: AccountInfo | null = account) {
  vi.mocked(useMsal).mockReturnValue({
    instance: { getActiveAccount: () => activeAccount },
    inProgress: InteractionStatus.None,
    accounts: activeAccount ? [activeAccount] : [],
  } as unknown as ReturnType<typeof useMsal>);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

// Same name as the MSAL account unless a test says otherwise, so the avatar doesn't change once /me loads.
function useMe(displayName: string | null) {
  server.use(
    http.get('*/me', () =>
      displayName === null
        ? HttpResponse.json({ title: 'Unavailable' }, { status: 500 })
        : HttpResponse.json({ ...currentUser, displayName }),
    ),
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    mockAuth();
    useMe(account.name ?? null);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    return act(() => setConnectionState('offline'));
  });

  it('has a Main navigation with Monitor, Incidents and Admin', async () => {
    renderAt('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Monitor' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Incidents' })).toHaveAttribute(
      'href',
      '/incidents',
    );
    expect(within(nav).getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });

  it('keeps Incidents active on an incident detail URL', async () => {
    renderAt('/incidents/INC-1042');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Incidents' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Monitor' })).not.toHaveAttribute('aria-current');
  });

  it('shows Report incident, the bell and the account avatar in the top bar', async () => {
    renderAt('/');
    expect(await screen.findByRole('link', { name: 'Report incident' })).toHaveAttribute(
      'href',
      '/report',
    );
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ana Reyes' })).toHaveTextContent('AR');
  });

  it('falls back to the username, then to a generic label, for the avatar', async () => {
    useMe(null);
    renderAt('/', { ...account, name: undefined });
    expect(await screen.findByRole('img', { name: 'ana.reyes@corp.example' })).toBeInTheDocument();
  });

  it('prefers the display name from /me for the avatar', async () => {
    useMe('Ada Responder');
    renderAt('/');
    expect(await screen.findByRole('img', { name: 'Ada Responder' })).toBeInTheDocument();
  });

  it('reaches the wordmark, nav links, Report incident and the bell by keyboard', async () => {
    renderAt('/');
    await screen.findByRole('navigation', { name: 'Main' });
    const user = userEvent.setup();
    const order = [
      'IncidentHub',
      'Monitor',
      'Incidents',
      'Admin',
      'Report incident',
      'Notifications',
    ];
    for (const name of order) {
      await user.tab();
      expect(
        screen.getByRole(name === 'Notifications' ? 'button' : 'link', { name }),
      ).toHaveFocus();
    }
  });

  it('renders Page not found inside the shell for an unknown URL', async () => {
    renderAt('/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Page not found');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  describe('connection banner', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it('reflects state changes within 1s', async () => {
      renderAt('/');
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('Offline');
      expect(screen.getByText(/Refreshing every 30 seconds/)).toBeInTheDocument();

      act(() => setConnectionState('reconnecting'));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('status')).toHaveTextContent('Reconnecting…');
      expect(screen.getByText(/Changes made by others may be delayed/)).toBeInTheDocument();

      act(() => setConnectionState('live'));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('status')).toHaveTextContent('Live');
      expect(screen.queryByText(/Changes made by others/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Refreshing every 30 seconds/)).not.toBeInTheDocument();
    });
  });
});
