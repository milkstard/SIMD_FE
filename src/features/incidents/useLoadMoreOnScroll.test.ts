import { LOAD_AHEAD_ROWS, shouldLoadMore } from './useLoadMoreOnScroll';

const base = {
  rowCount: 100,
  hasNextPage: true,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
};

describe('shouldLoadMore', () => {
  it('loads when the last rendered row is near the end', () => {
    expect(shouldLoadMore(100 - LOAD_AHEAD_ROWS, base)).toBe(true);
    expect(shouldLoadMore(99, base)).toBe(true);
  });

  it('waits while the last rendered row is far from the end', () => {
    expect(shouldLoadMore(100 - LOAD_AHEAD_ROWS - 1, base)).toBe(false);
  });

  it('never loads at the end of the list', () => {
    expect(shouldLoadMore(99, { ...base, hasNextPage: false })).toBe(false);
  });

  it('does not load while a page is being fetched', () => {
    expect(shouldLoadMore(99, { ...base, isFetchingNextPage: true })).toBe(false);
  });

  it('does not retry a failed page by itself', () => {
    expect(shouldLoadMore(99, { ...base, isFetchNextPageError: true })).toBe(false);
  });
});
