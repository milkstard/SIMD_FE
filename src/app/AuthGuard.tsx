import { AuthError, EventType, InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useEffect, useState, type ReactNode } from 'react';
import { isAccessDenied, loginRequest } from './msal';
import { useSessionStore } from './sessionStore';
import { SignInPage } from './signIn/SignInPage';

/** Renders children only for a signed-in account; otherwise the sign-in page. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { instance, inProgress, accounts } = useMsal();
  const [error, setError] = useState<AuthError | null>(null);
  const expired = useSessionStore((state) => state.expired);
  const resetSession = useSessionStore((state) => state.reset);

  useEffect(() => {
    const id = instance.addEventCallback(
      (message) => {
        if (message.eventType === EventType.ACQUIRE_TOKEN_FAILURE && message.error instanceof AuthError) {
          setError(message.error);
        }
        if (message.eventType === EventType.LOGIN_SUCCESS) {
          setError(null);
          resetSession();
        }
      },
      [EventType.ACQUIRE_TOKEN_FAILURE, EventType.LOGIN_SUCCESS],
    );
    return () => {
      if (id) instance.removeEventCallback(id);
    };
  }, [instance, resetSession]);

  if (inProgress !== InteractionStatus.None) return <SignInPage state="signingIn" />;
  const denied = isAccessDenied(error);
  const signIn = () => {
    void instance.loginRedirect(denied ? { ...loginRequest, prompt: 'select_account' } : loginRequest);
  };

  if (expired) return <SignInPage state="expired" onSignIn={signIn} />;
  if (accounts.length > 0) return <>{children}</>;

  return <SignInPage state={denied ? 'denied' : 'signIn'} error={error} onSignIn={signIn} />;
}
