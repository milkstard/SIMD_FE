import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('updates only after the value has been still for the delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('abc');
  });
});
