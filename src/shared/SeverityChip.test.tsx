import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { theme } from '@/app/theme';
import { SEVERITIES } from '@/types/severity';
import { SeverityChip } from './SeverityChip';

describe('SeverityChip', () => {
  it.each(SEVERITIES)('shows the %s word and a glyph, not colour alone', (severity) => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <SeverityChip severity={severity} />
      </ThemeProvider>,
    );

    expect(screen.getByText(severity)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
