import { HubConnectionState } from '@microsoft/signalr';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createFakeConnection } from '@/test/fakeConnection';
import { setConnectionState } from './connectionStore';
import { useDashboardSubscription } from './useDashboardSubscription';
import { SignalRContext } from './useSignalRConnection';

function setup() {
  const harness = createFakeConnection();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SignalRContext.Provider value={harness.connection}>{children}</SignalRContext.Provider>
  );
  return { ...harness, wrapper };
}

beforeEach(() => setConnectionState('offline'));

describe('useDashboardSubscription', () => {
  it('joins on mount and leaves on unmount', () => {
    const { fake, wrapper } = setup();
    fake.state = HubConnectionState.Connected;
    act(() => setConnectionState('live'));
    const { unmount } = renderHook(() => useDashboardSubscription(), { wrapper });
    expect(fake.invoke).toHaveBeenCalledWith('JoinDashboard');
    unmount();
    expect(fake.invoke).toHaveBeenLastCalledWith('LeaveDashboard');
  });

  it('skips safely while offline, then joins once live', () => {
    const { fake, wrapper } = setup();
    renderHook(() => useDashboardSubscription(), { wrapper });
    expect(fake.invoke).not.toHaveBeenCalled();
    fake.state = HubConnectionState.Connected;
    act(() => setConnectionState('live'));
    expect(fake.invoke).toHaveBeenCalledWith('JoinDashboard');
  });

  it('re-joins after a reconnect without leaving while disconnected', () => {
    const { fake, wrapper } = setup();
    fake.state = HubConnectionState.Connected;
    act(() => setConnectionState('live'));
    renderHook(() => useDashboardSubscription(), { wrapper });
    fake.state = HubConnectionState.Reconnecting;
    act(() => setConnectionState('reconnecting'));
    expect(fake.invoke).toHaveBeenCalledTimes(1);
    fake.state = HubConnectionState.Connected;
    act(() => setConnectionState('live'));
    expect(fake.invoke.mock.calls.map(([method]) => method)).toEqual(['JoinDashboard', 'JoinDashboard']);
  });

  it('logs a failed invoke instead of throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fake, wrapper } = setup();
    fake.invoke.mockRejectedValueOnce(new Error('no such method'));
    fake.state = HubConnectionState.Connected;
    act(() => setConnectionState('live'));
    renderHook(() => useDashboardSubscription(), { wrapper });
    await act(async () => {});
    expect(warn).toHaveBeenCalledWith('[realtime] JoinDashboard failed', expect.any(Error));
    warn.mockRestore();
  });
});
