import type { IPublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { msalInstance } from './msal';
import { queryClient as defaultQueryClient } from './queryClient';
import { theme } from './theme';

interface AppProvidersProps {
  children: ReactNode;
  /** Injectable for tests; defaults to the app-wide MSAL instance. */
  instance?: IPublicClientApplication;
  /** Injectable for tests; defaults to the app-wide query client. */
  queryClient?: QueryClient;
}

export function AppProviders({
  children,
  instance = msalInstance,
  queryClient = defaultQueryClient,
}: AppProvidersProps) {
  return (
    <MsalProvider instance={instance}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme} defaultMode="system">
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}
