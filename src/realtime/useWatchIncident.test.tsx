import { HubConnectionState } from '@microsoft/signalr';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createFakeConnection } from '@/test/fakeConnection';
import { setConnectionState } from './connectionStore';
import { SignalRContext } from './useSignalRConnection';
import { useWatchIncident } from './useWatchIncident';

function setup() {
  const harness = createFakeConnection();
  harness.fake.state = HubConnectionState.Connected;
  act(() => setConnectionState('live'));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SignalRContext.Provider value={harness.connection}>{children}</SignalRContext.Provider>
  );
  return { ...harness, wrapper };
}

beforeEach(() => setConnectionState('offline'));

describe('useWatchIncident', () => {
  it('watches on mount and unwatches on unmount', () => {
    const { fake, wrapper } = setup();
    const { unmount } = renderHook(() => useWatchIncident('id-1'), { wrapper });
    expect(fake.invoke).toHaveBeenCalledWith('WatchIncident', 'id-1');
    unmount();
    expect(fake.invoke).toHaveBeenLastCalledWith('UnwatchIncident', 'id-1');
  });

  it('unwatches the old id before watching a new one', () => {
    const { fake, wrapper } = setup();
    const { rerender } = renderHook(({ id }) => useWatchIncident(id), {
      wrapper,
      initialProps: { id: 'id-1' as string | undefined },
    });
    rerender({ id: 'id-2' });
    expect(fake.invoke.mock.calls).toEqual([
      ['WatchIncident', 'id-1'],
      ['UnwatchIncident', 'id-1'],
      ['WatchIncident', 'id-2'],
    ]);
  });

  it('does nothing without an id', () => {
    const { fake, wrapper } = setup();
    const { unmount } = renderHook(() => useWatchIncident(undefined), { wrapper });
    unmount();
    expect(fake.invoke).not.toHaveBeenCalled();
  });

  it('skips while not connected and re-watches after a reconnect', () => {
    const { fake, wrapper } = setup();
    fake.state = HubConnectionState.Reconnecting;
    act(() => setConnectionState('reconnecting'));
    renderHook(() => useWatchIncident('id-1'), { wrapper });
    expect(fake.invoke).not.toHaveBeenCalled();
    fake.state = HubConnectionState.Connected;
    act(() => setConnectionState('live'));
    expect(fake.invoke).toHaveBeenCalledWith('WatchIncident', 'id-1');
  });

  it('does not unwatch while disconnected, then watches again on reconnect', () => {
    const { fake, wrapper } = setup();
    renderHook(() => useWatchIncident('id-1'), { wrapper });
    fake.state = HubConnectionState.Reconnecting;
    act(() => setConnectionState('reconnecting'));
    fake.state = HubConnectionState.Connected;
    act(() => setConnectionState('live'));
    expect(fake.invoke.mock.calls.map(([method]) => method)).toEqual(['WatchIncident', 'WatchIncident']);
  });
});
