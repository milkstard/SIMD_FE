import { HubConnectionState } from '@microsoft/signalr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { setConnectionState, useConnectionStore } from './connectionStore';
import { createFakeConnection } from '@/test/fakeConnection';
import { OFFLINE_REFRESH_MS, useOfflineFallback } from './useOfflineFallback';

function setup() {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const harness = createFakeConnection();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const view = renderHook(() => useOfflineFallback(harness.connection), { wrapper });
  return { ...harness, invalidate, ...view };
}

beforeEach(() => {
  vi.useFakeTimers();
  setConnectionState('offline');
});
afterEach(() => vi.useRealTimers());

describe('useOfflineFallback', () => {
  it('refetches and retries the connection every 30 s while offline', async () => {
    const { fake, invalidate } = setup();
    expect(invalidate).not.toHaveBeenCalled();

    // Keep the retry failing so the state stays offline across ticks.
    fake.start.mockRejectedValue(new Error('down'));
    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS));
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(fake.start).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS));
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(fake.start).toHaveBeenCalledTimes(2);
  });

  it('goes live and refetches when a retry succeeds, then stops ticking', async () => {
    const { fake, invalidate } = setup();
    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS));
    expect(useConnectionStore.getState().state).toBe('live');
    expect(invalidate).toHaveBeenCalledTimes(2); // tick refetch + reconnect refetch

    invalidate.mockClear();
    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS * 3));
    expect(invalidate).not.toHaveBeenCalled();
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('does not run while live or reconnecting', async () => {
    const { invalidate } = setup();
    act(() => setConnectionState('reconnecting'));
    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS * 2));
    act(() => setConnectionState('live'));
    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS * 2));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('refetches but does not restart a connection that is not disconnected', async () => {
    const { fake, invalidate } = setup();
    fake.state = HubConnectionState.Connecting;
    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS));
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(fake.start).not.toHaveBeenCalled();
  });

  it('clears the timer on unmount', async () => {
    const { invalidate, unmount } = setup();
    unmount();
    await act(async () => vi.advanceTimersByTimeAsync(OFFLINE_REFRESH_MS * 2));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
