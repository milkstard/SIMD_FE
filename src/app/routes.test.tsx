import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from './routes';
import { theme } from './theme';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

describe('routes', () => {
  it.each([
    ['/', 'Monitor'],
    ['/incidents', 'Incidents'],
    ['/incidents/INC-1042', 'Incident INC-1042'],
    ['/report', 'Report incident'],
    ['/admin/teams', 'Admin'],
  ])('%s renders the %s screen', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('gives the root and every top-level route its own error boundary', () => {
    const [root] = routes;
    expect(root?.errorElement).toBeDefined();
    expect(root?.children).toHaveLength(6);
    root?.children?.forEach((child) => expect(child.errorElement).toBeDefined());
  });

  it('shows Page not found for an unknown URL', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderAt('/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Page not found');
    vi.restoreAllMocks();
  });
});
