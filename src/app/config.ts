const required = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
};

export const config = {
  msalClientId: required(import.meta.env.VITE_MSAL_CLIENT_ID, 'VITE_MSAL_CLIENT_ID'),
  msalAuthority: required(import.meta.env.VITE_MSAL_AUTHORITY, 'VITE_MSAL_AUTHORITY'),
  apiScope: required(import.meta.env.VITE_API_SCOPE, 'VITE_API_SCOPE'),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  hubUrl: import.meta.env.VITE_HUB_URL ?? '/hubs/incidents',
} as const;
