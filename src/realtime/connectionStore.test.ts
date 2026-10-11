import { act, renderHook } from '@testing-library/react';
import { setConnectionState, useConnectionState } from './connectionStore';

describe('connectionStore', () => {
  afterEach(() => act(() => setConnectionState('offline')));

  it('starts Offline until the real connection reports otherwise', () => {
    const { result } = renderHook(() => useConnectionState());
    expect(result.current).toBe('offline');
  });

  it('updates subscribers when the state is set', () => {
    const { result } = renderHook(() => useConnectionState());
    act(() => setConnectionState('reconnecting'));
    expect(result.current).toBe('reconnecting');
    act(() => setConnectionState('live'));
    expect(result.current).toBe('live');
  });
});
