import { fillHeight, MIN_FILL_HEIGHT } from './useFillViewportHeight';

describe('fillHeight', () => {
  it('fills the viewport below the element, minus the bottom reserve', () => {
    expect(fillHeight(1000, 300)).toBe(628);
  });

  it('grows and shrinks with the element position (e.g. a wrapping filter bar)', () => {
    expect(fillHeight(1000, 400)).toBeLessThan(fillHeight(1000, 300));
  });

  it('never goes below the minimum height', () => {
    expect(fillHeight(500, 400)).toBe(MIN_FILL_HEIGHT);
  });
});
