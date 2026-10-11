import {
  AuthError,
  EventType,
  InteractionStatus,
  type AccountInfo,
  type EventCallbackFunction,
  type EventMessage,
} from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { ThemeProvider } from '@mui/material';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthGuard } from './AuthGuard';
import { config } from './config';
import { useSessionStore } from './sessionStore';
import { theme } from './theme';

vi.mock('@azure/msal-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@azure/msal-react')>()),
  useMsal: vi.fn(),
}));

const account: AccountInfo = {
  homeAccountId: 'home-1',
  environment: 'login.microsoftonline.com',
  tenantId: 'tenant-1',
  username: 'responder@corp.example',
  localAccountId: 'local-1',
};

function setup(inProgress: InteractionStatus, accounts: AccountInfo[] = []) {
  const callbacks: EventCallbackFunction[] = [];
  const instance = {
    loginRedirect: vi.fn().mockResolvedValue(undefined),
    addEventCallback: vi.fn((cb: EventCallbackFunction) => {
      callbacks.push(cb);
      return 'cb-1';
    }),
    removeEventCallback: vi.fn(),
  };
  vi.mocked(useMsal).mockReturnValue({
    instance,
    inProgress,
    accounts,
    logger: {},
  } as unknown as ReturnType<typeof useMsal>);

  const { unmount } = render(
    <ThemeProvider theme={theme}>
      <AuthGuard>
        <p>Protected app</p>
      </AuthGuard>
    </ThemeProvider>,
  );

  const emit = (message: Partial<EventMessage>) =>
    act(() => callbacks.forEach((cb) => cb(message as EventMessage)));
  return { instance, emit, unmount };
}

describe('AuthGuard', () => {
  beforeEach(() => useSessionStore.getState().reset());

  it('shows the sign-in page to a signed-out user and redirects to Entra login on click', async () => {
    const { instance } = setup(InteractionStatus.None);

    expect(screen.getByRole('heading', { name: 'Sign in to IncidentHub' })).toBeInTheDocument();
    expect(screen.queryByText('Protected app')).not.toBeInTheDocument();
    expect(instance.loginRedirect).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Microsoft' }));

    expect(instance.loginRedirect).toHaveBeenCalledTimes(1);
    expect(instance.loginRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: [config.apiScope] }),
    );
  });

  it.each([InteractionStatus.Startup, InteractionStatus.HandleRedirect])(
    'shows a loading state while MSAL is in %s',
    (status) => {
      setup(status);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Signing you in…' })).toBeInTheDocument();
      expect(screen.queryByText('Protected app')).not.toBeInTheDocument();
    },
  );

  it('renders the app for a signed-in account', () => {
    const { instance } = setup(InteractionStatus.None, [account]);

    expect(screen.getByText('Protected app')).toBeInTheDocument();
    expect(instance.loginRedirect).not.toHaveBeenCalled();
  });

  it('shows access denied when Entra refuses the account, and lets the user pick another', async () => {
    const { instance, emit } = setup(InteractionStatus.None);
    const error = new AuthError(
      'access_denied',
      '7c1e0a94b2f3',
      'AADSTS50105: user is not assigned to a role',
    );

    emit({ eventType: EventType.ACQUIRE_TOKEN_FAILURE, error });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("We couldn't sign you in");
    expect(alert).toHaveTextContent('access_denied · trace 7c1e0a94b2f3');
    expect(screen.getByRole('heading', { name: 'Try a different account' })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Sign in with another Microsoft account' }),
    );
    expect(instance.loginRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: [config.apiScope], prompt: 'select_account' }),
    );
  });

  it('shows a generic retry message for other sign-in errors', () => {
    const { emit } = setup(InteractionStatus.None);

    emit({ eventType: EventType.ACQUIRE_TOKEN_FAILURE, error: new AuthError('network_error', 'corr-2') });

    expect(screen.getByRole('alert')).toHaveTextContent("Sign-in didn't finish");
    expect(screen.getByRole('heading', { name: 'Sign in to IncidentHub' })).toBeInTheDocument();
  });

  it('removes its MSAL event callback on unmount', () => {
    const { instance, unmount } = setup(InteractionStatus.None);
    unmount();
    expect(instance.removeEventCallback).toHaveBeenCalledWith('cb-1');
  });

  it('shows the session-expired page when the token refresh needs sign-in, even with an account', async () => {
    useSessionStore.getState().markExpired();
    const { instance } = setup(InteractionStatus.None, [account]);

    expect(screen.getByRole('status')).toHaveTextContent('Your session ended');
    expect(screen.getByRole('heading', { name: 'Sign in again' })).toBeInTheDocument();
    expect(screen.queryByText('Protected app')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Microsoft' }));
    expect(instance.loginRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: [config.apiScope] }),
    );
  });
});
