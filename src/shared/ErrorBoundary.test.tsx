import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Outlet, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { theme } from '@/app/theme';
import { ErrorBoundary } from './ErrorBoundary';

function Root() {
  return (
    <>
      <p>Root content</p>
      <Link to="/fine">Go to fine</Link>
      <Outlet />
    </>
  );
}

function renderAt(path: string, Boom: () => JSX.Element) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Root />,
        errorElement: <ErrorBoundary />,
        children: [
          { path: 'boom', element: <Boom />, errorElement: <ErrorBoundary /> },
          { path: 'fine', element: <h1>Fine screen</h1>, errorElement: <ErrorBoundary /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React and the router log caught render errors; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('catches an error inside its route while the rest of the app keeps working', async () => {
    const Boom = (): JSX.Element => {
      throw new Error('kaboom');
    };
    renderAt('/boom', Boom);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong on this screen.',
    );
    expect(screen.getByText('Root content')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Go to fine' }));
    expect(await screen.findByRole('heading', { name: 'Fine screen' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the ProblemDetails title and trace id for an ApiError', async () => {
    const Boom = (): JSX.Element => {
      throw new ApiError(500, { title: 'Server error', status: 500, traceId: '00-abc-01' });
    };
    renderAt('/boom', Boom);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Server error');
    expect(alert).toHaveTextContent('Trace ID: 00-abc-01');
  });

  it('re-renders the route when Retry is clicked after the error clears', async () => {
    // React retries a failed render once, so keep failing until the "transient" problem clears.
    const shouldFail = vi.fn(() => true);
    const ThrowsOnce = (): JSX.Element => {
      if (shouldFail()) throw new Error('flaky');
      return <h1>Recovered</h1>;
    };
    renderAt('/boom', ThrowsOnce);

    await screen.findByRole('alert');
    shouldFail.mockReturnValue(false);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Recovered' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows Page not found for an unknown URL, without a Retry button', async () => {
    renderAt('/nope', () => <p>unused</p>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Page not found');
    expect(screen.getByRole('link', { name: 'Monitor' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
