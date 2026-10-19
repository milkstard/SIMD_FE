import type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { msalInstance } from '@/app/msal';
import { theme } from '@/app/theme';
import { ToastHost } from '@/shared/toast/ToastHost';

/** Gives `apiRequest` a token without MSAL. Pair with `vi.restoreAllMocks()` in `afterEach`. */
export function mockAuth() {
  vi.spyOn(msalInstance, 'getActiveAccount').mockReturnValue({ homeAccountId: 'home-1' } as AccountInfo);
  vi.spyOn(msalInstance, 'acquireTokenSilent').mockResolvedValue({
    accessToken: 'token-1',
  } as AuthenticationResult);
}

// eslint-disable-next-line react-refresh/only-export-components -- test helper file, not a refresh boundary
function DetailStub() {
  return <p>Incident page {useParams().number}</p>;
}

/** Renders `ui` at `/report` inside router, query client, theme and toast host; `/incidents/:number` is a stub. */
export function renderAtReport(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/report']}>
          <Routes>
            <Route path="/report" element={ui} />
            <Route path="/incidents/:number" element={<DetailStub />} />
          </Routes>
        </MemoryRouter>
        <ToastHost />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

/** Renders `ui` at `/incidents` inside router, query client and theme; `/incidents/:number` is a stub. */
export function renderAtIncidents(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/incidents']}>
          <Routes>
            <Route path="/incidents" element={ui} />
            <Route path="/incidents/:number" element={<DetailStub />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...result, queryClient };
}
