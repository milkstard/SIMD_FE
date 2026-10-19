import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { mockAuth } from '@/test/renderWithProviders';
import { App } from './App';
import { theme } from './theme';

describe('App', () => {
  beforeEach(mockAuth);
  afterEach(() => vi.restoreAllMocks());

  it('renders the Monitor screen at /', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Monitor' })).toBeInTheDocument();
  });
});
