import { ThemeProvider } from '@mui/material';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { theme } from '@/app/theme';
import { ToastHost } from './ToastHost';
import { useToastStore } from './toastStore';

function setup() {
  render(
    <ThemeProvider theme={theme}>
      <ToastHost />
    </ThemeProvider>,
  );
}

afterEach(() => useToastStore.getState().close());

describe('ToastHost', () => {
  it('renders nothing until a toast is shown', () => {
    setup();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the message and the trace ID, and closes on request', async () => {
    setup();

    act(() =>
      useToastStore
        .getState()
        .show({ message: 'Something went wrong.', severity: 'error', traceId: '00-4bf92f35-01' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(screen.getByText(/00-4bf92f35-01/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(useToastStore.getState().toast).toBeNull();
  });
});
