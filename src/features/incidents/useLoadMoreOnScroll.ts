import { useEffect, useRef } from 'react';
import type { GridApi } from '@mui/x-data-grid';

/** Load the next page when the last rendered row is within this many rows of the end. */
export const LOAD_AHEAD_ROWS = 10;

interface LoadState {
  rowCount: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
}

/**
 * A failed page is retried only by the footer button, and the end of the list is never retried.
 */
export function shouldLoadMore(lastRowIndex: number, state: LoadState): boolean {
  if (!state.hasNextPage || state.isFetchingNextPage || state.isFetchNextPageError) return false;
  return lastRowIndex >= state.rowCount - LOAD_AHEAD_ROWS;
}

interface Options extends LoadState {
  apiRef: { current: GridApi | null };
  onLoadMore: () => void;
}

/**
 * The MIT DataGrid has no `onRowsScrollEnd`, so this listens to the public `renderedRowsIntervalChange`
 * event. It checks again when a page lands, so a tall viewport that already shows the end keeps loading.
 */
export function useLoadMoreOnScroll({ apiRef, onLoadMore, ...state }: Options) {
  const lastRowIndex = useRef(-1);
  const latest = useRef({ state, onLoadMore });
  // Scroll events can fire again before `isFetchingNextPage` commits; one request per page is enough.
  const requestedAt = useRef(-1);

  const { rowCount, hasNextPage, isFetchingNextPage, isFetchNextPageError } = state;

  const loadMore = () => {
    if (requestedAt.current === latest.current.state.rowCount) return;
    requestedAt.current = latest.current.state.rowCount;
    latest.current.onLoadMore();
  };

  // Declared first so the event and re-check effects below always read the current flags.
  useEffect(() => {
    latest.current = {
      state: { rowCount, hasNextPage, isFetchingNextPage, isFetchNextPageError },
      onLoadMore,
    };
  });

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    return api.subscribeEvent('renderedRowsIntervalChange', (context) => {
      lastRowIndex.current = context.lastRowIndex;
      if (shouldLoadMore(context.lastRowIndex, latest.current.state)) loadMore();
    });
  }, [apiRef]);

  // A settled fetch (success or failure) allows the next request.
  useEffect(() => {
    if (!isFetchingNextPage) requestedAt.current = -1;
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (lastRowIndex.current >= 0 && shouldLoadMore(lastRowIndex.current, latest.current.state)) {
      loadMore();
    }
  }, [rowCount, hasNextPage, isFetchingNextPage, isFetchNextPageError]);
}
