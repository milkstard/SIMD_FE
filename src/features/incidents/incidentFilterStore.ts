import { create } from 'zustand';
import type { IncidentFilters } from './incidentFilters';
import type { SavedViewId } from './savedViews';

interface IncidentFilterState {
  filters: IncidentFilters;
  activeViewId: SavedViewId | null;
  /** Bumped when the filters are replaced from outside the bar (a view, Clear); the search box remounts on it. */
  resetKey: number;
  /** Editing a filter leaves any saved view. */
  setFilter: <K extends keyof IncidentFilters>(key: K, value: IncidentFilters[K]) => void;
  /** Replaces the filters with the view's; the sort is not part of a view and is kept. */
  applyView: (id: SavedViewId, filters: IncidentFilters) => void;
  reset: () => void;
}

/** UI state only (CLAUDE.md): which filters are chosen. The rows live in TanStack Query. */
export const useIncidentFilterStore = create<IncidentFilterState>((set) => ({
  filters: {},
  activeViewId: null,
  resetKey: 0,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value }, activeViewId: null })),
  applyView: (id, filters) =>
    set((state) => ({
      filters: { ...filters, sort: state.filters.sort },
      activeViewId: id,
      resetKey: state.resetKey + 1,
    })),
  reset: () =>
    set((state) => ({
      filters: { sort: state.filters.sort },
      activeViewId: null,
      resetKey: state.resetKey + 1,
    })),
}));
