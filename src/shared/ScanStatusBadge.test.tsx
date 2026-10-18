import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { theme } from '@/app/theme';
import { ScanStatusBadge, type ScanStatus } from './ScanStatusBadge';

describe('ScanStatusBadge', () => {
  it.each<ScanStatus>(['Pending', 'Clean', 'Infected'])('shows %s as an icon and its word', (status) => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ScanStatusBadge status={status} />
      </ThemeProvider>,
    );

    expect(screen.getByText(status)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
