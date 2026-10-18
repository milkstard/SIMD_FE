import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { theme } from '@/app/theme';
import { STATUS_LABELS, type IncidentStatus } from '@/types/workflow';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it.each(Object.keys(STATUS_LABELS) as IncidentStatus[])(
    'shows the word and a glyph for %s',
    (status) => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StatusBadge status={status} />
        </ThemeProvider>,
      );

      expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
      expect(container.querySelector('svg')).not.toBeNull();
    },
  );

  it.each(['Escalated', 'constructor', 'toString', '__proto__'])(
    'falls back to the raw word and a neutral glyph for the unknown status %s',
    (unknown) => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StatusBadge status={unknown as IncidentStatus} />
        </ThemeProvider>,
      );

      expect(screen.getByText(unknown)).toBeInTheDocument();
      expect(container.querySelector('svg')).not.toBeNull();
    },
  );
});
