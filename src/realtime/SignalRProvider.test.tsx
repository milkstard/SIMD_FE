import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { theme } from '@/app/theme';
import { ConnectionBanner } from '@/shared/ConnectionBanner';
import { setConnectionState, useConnectionState, useConnectionStore } from './connectionStore';
import { createConnection } from './createConnection';
import { createFakeConnection } from '@/test/fakeConnection';
import { SignalRProvider } from './SignalRProvider';

vi.mock('./createConnection', () => ({ createConnection: vi.fn() }));

function Banner() {
  return <ConnectionBanner state={useConnectionState()} compact />;
}

function setup(start: () => Promise<void> = () => Promise.resolve()) {
  const harness = createFakeConnection();
  harness.fake.start.mockImplementation(start);
  vi.mocked(createConnection).mockReturnValue(harness.connection);
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const view = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <SignalRProvider>
          <Banner />
        </SignalRProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...harness, invalidate, ...view };
}

beforeEach(() => {
  vi.mocked(createConnection).mockReset();
  setConnectionState('offline');
});

describe('SignalRProvider', () => {
  it('creates one connection and starts it', async () => {
    const { fake } = setup();
    await act(async () => {});
    expect(createConnection).toHaveBeenCalledTimes(1);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('shows Reconnecting while starting, then Live', async () => {
    let resolveStart: () => void = () => {};
    setup(() => new Promise<void>((resolve) => (resolveStart = resolve)));
    await act(async () => {}); // start() is chained behind the previous stop()
    expect(screen.getByText('Reconnecting…')).toBeInTheDocument();
    await act(async () => resolveStart());
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('goes Offline when the first start fails', async () => {
    setup(() => Promise.reject(new Error('down')));
    await act(async () => {});
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('follows reconnecting, reconnected and close, and refetches on reconnect', async () => {
    const { fire, invalidate } = setup();
    await act(async () => {});

    act(() => fire('reconnecting'));
    expect(screen.getByText('Reconnecting…')).toBeInTheDocument();

    invalidate.mockClear();
    act(() => fire('reconnected'));
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledTimes(1);

    act(() => fire('close'));
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('stops the connection and goes Offline on unmount', async () => {
    const { fake, unmount } = setup();
    await act(async () => {});
    unmount();
    expect(fake.stop).toHaveBeenCalledTimes(1);
    expect(useConnectionStore.getState().state).toBe('offline');
  });

  it('ignores a start() that settles after unmount', async () => {
    let resolveStart: () => void = () => {};
    const { unmount } = setup(() => new Promise<void>((resolve) => (resolveStart = resolve)));
    await act(async () => {});
    unmount();
    await act(async () => resolveStart());
    expect(useConnectionStore.getState().state).toBe('offline');
  });

  it('recovers through the 30 s retry after the first start fails', async () => {
    vi.useFakeTimers();
    try {
      const { fake } = setup(() => Promise.reject(new Error('down')));
      await act(async () => vi.advanceTimersByTimeAsync(0));
      expect(screen.getByText('Offline')).toBeInTheDocument();

      fake.start.mockImplementation(() => Promise.resolve());
      await act(async () => vi.advanceTimersByTimeAsync(30_000));
      expect(fake.start).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Live')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('survives a StrictMode remount: starts after the first stop and ends Live', async () => {
    const harness = createFakeConnection();
    vi.mocked(createConnection).mockReturnValue(harness.connection);
    render(
      <StrictMode>
        <QueryClientProvider client={new QueryClient()}>
          <SignalRProvider>
            <Banner />
          </SignalRProvider>
        </QueryClientProvider>
      </StrictMode>,
    );
    await act(async () => {});
    expect(harness.fake.stop).toHaveBeenCalledTimes(1);
    expect(harness.fake.start).toHaveBeenCalledTimes(1);
    // Callbacks are registered once even though the effect ran twice.
    expect(harness.fake.onclose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
