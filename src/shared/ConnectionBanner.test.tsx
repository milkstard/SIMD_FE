import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { theme } from '@/app/theme';
import type { ConnectionState } from '@/realtime/connectionStore';
import { ConnectionBanner } from './ConnectionBanner';

function renderBanner(state: ConnectionState, props: { compact?: boolean; live?: boolean } = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ConnectionBanner state={state} {...props} />
    </ThemeProvider>,
  );
}

describe('ConnectionBanner', () => {
  it.each([
    ['live', 'Live', 'Updates arrive as they happen.'],
    ['reconnecting', 'Reconnecting…', 'Changes made by others may be delayed.'],
    ['offline', 'Offline', 'Live updates are paused. Reload to see the latest changes.'],
  ] as const)('shows the %s word, detail and a dot', (state, word, detail) => {
    const { container } = renderBanner(state);
    expect(screen.getByText(word)).toBeInTheDocument();
    expect(screen.getByText(detail)).toBeInTheDocument();
    // The dot is decorative; the word carries the meaning, so colour is never the only signal.
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('hides the detail when compact', () => {
    renderBanner('offline', { compact: true });
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.queryByText(/Live updates are paused/)).not.toBeInTheDocument();
  });

  it('is a status live region only when asked to announce', () => {
    const { unmount } = renderBanner('live');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    unmount();

    renderBanner('live', { live: true });
    expect(screen.getByRole('status')).toHaveTextContent('Live');
  });
});
