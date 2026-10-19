import { useIncidentFilterStore } from './incidentFilterStore';

const store = useIncidentFilterStore;

describe('incidentFilterStore', () => {
  it('applyView sets exactly the view filters and the active view', () => {
    store.getState().setFilter('q', 'checkout');
    store.getState().setFilter('severity', ['High']);

    store.getState().applyView('mine', { assignee: 'me' });

    expect(store.getState().filters).toEqual({ assignee: 'me', sort: undefined });
    expect(store.getState().activeViewId).toBe('mine');
  });

  it('keeps the sort when a view is applied', () => {
    store.getState().setFilter('sort', 'severity');
    store.getState().applyView('slaAtRisk', { slaBreached: true });

    expect(store.getState().filters).toEqual({ slaBreached: true, sort: 'severity' });
  });

  it('editing a filter clears the active view but keeps the other filters', () => {
    store.getState().applyView('mine', { assignee: 'me' });

    store.getState().setFilter('status', ['New']);

    expect(store.getState().activeViewId).toBeNull();
    expect(store.getState().filters).toMatchObject({ assignee: 'me', status: ['New'] });
  });

  it('reset empties the filters and the active view', () => {
    store.getState().applyView('unassigned', { assignee: 'unassigned' });

    store.getState().reset();

    expect(store.getState().filters).toEqual({ sort: undefined });
    expect(store.getState().activeViewId).toBeNull();
  });

  it('bumps resetKey on applyView and reset, but not on setFilter', () => {
    const start = store.getState().resetKey;

    store.getState().setFilter('q', 'x');
    expect(store.getState().resetKey).toBe(start);

    store.getState().applyView('mine', { assignee: 'me' });
    expect(store.getState().resetKey).toBe(start + 1);

    store.getState().reset();
    expect(store.getState().resetKey).toBe(start + 2);
  });
});
