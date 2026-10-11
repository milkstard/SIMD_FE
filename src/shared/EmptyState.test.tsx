import { Button, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { theme } from '@/app/theme';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title, description and action', () => {
    render(
      <ThemeProvider theme={theme}>
        <EmptyState
          title="No incidents"
          description="Nothing is open right now."
          action={<Button>Report incident</Button>}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'No incidents' })).toBeInTheDocument();
    expect(screen.getByText('Nothing is open right now.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report incident' })).toBeInTheDocument();
  });

  it('renders only the title when nothing else is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <EmptyState title="No data" />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'No data' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
