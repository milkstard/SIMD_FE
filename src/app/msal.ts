import {
  AuthError,
  EventType,
  PublicClientApplication,
  type AuthenticationResult,
  type RedirectRequest,
} from '@azure/msal-browser';
import { config } from './config';

// MSAL owns the token cache (sessionStorage); the app never stores tokens itself.
export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: config.msalClientId,
    authority: config.msalAuthority,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage' },
});

export const loginRequest: RedirectRequest = { scopes: [config.apiScope] };

const isAuthResult = (payload: unknown): payload is AuthenticationResult =>
  typeof payload === 'object' && payload !== null && 'account' in payload;

// Keep an active account so silent token calls (FE-02.02) know whom to act for.
msalInstance.addEventCallback((message) => {
  if (
    (message.eventType === EventType.LOGIN_SUCCESS ||
      message.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
    isAuthResult(message.payload)
  ) {
    msalInstance.setActiveAccount(message.payload.account);
  }
  if (message.eventType === EventType.INITIALIZE_END && !msalInstance.getActiveAccount()) {
    const [first] = msalInstance.getAllAccounts();
    if (first) msalInstance.setActiveAccount(first);
  }
});

const ACCESS_DENIED_CODES = ['AADSTS50105', 'access_denied'];

/** True when Entra ID refused the account (e.g. not assigned to the app / not in an IncidentHub group). */
export function isAccessDenied(error: unknown): error is AuthError {
  if (!(error instanceof AuthError)) return false;
  const text = `${error.errorCode} ${error.errorMessage}`;
  return ACCESS_DENIED_CODES.some((code) => text.includes(code));
}
