import { AuthError } from '@azure/msal-browser';
import { config } from './config';
import { isAccessDenied, loginRequest } from './msal';

describe('isAccessDenied', () => {
  it('is true for an Entra "user not assigned" error', () => {
    expect(isAccessDenied(new AuthError('invalid_grant', 'corr-1', 'AADSTS50105: not assigned'))).toBe(true);
  });

  it('is true for an access_denied error code', () => {
    expect(isAccessDenied(new AuthError('access_denied', 'corr-1'))).toBe(true);
  });

  it('is false for other MSAL errors', () => {
    expect(isAccessDenied(new AuthError('network_error', 'corr-1', 'offline'))).toBe(false);
  });

  it('is false for non-MSAL values', () => {
    expect(isAccessDenied(new Error('AADSTS50105'))).toBe(false);
    expect(isAccessDenied(null)).toBe(false);
  });
});

describe('loginRequest', () => {
  it('asks for the API scope', () => {
    expect(loginRequest.scopes).toEqual([config.apiScope]);
  });
});
