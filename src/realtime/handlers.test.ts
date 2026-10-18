import { QueryClient, type InfiniteData } from '@tanstack/react-query';
import type { components } from '@/api/generated/schema';
import { createFakeConnection } from '@/test/fakeConnection';
import { dashboardKeys, incidentKeys, notificationKeys } from '@/api/keys';
import { HUB_EVENTS, registerHandlers } from './handlers';

describe('registerHandlers', () => {
  it('registers one handler per server event', () => {
    const { fake, connection } = createFakeConnection();
    registerHandlers(connection, new QueryClient());
    expect(fake.on.mock.calls.map(([event]) => event).sort()).toEqual([...HUB_EVENTS].sort());
  });

  it('removes every handler it registered', () => {
    const { fake, connection } = createFakeConnection();
    const unregister = registerHandlers(connection, new QueryClient());
    unregister();
    expect(fake.off).toHaveBeenCalledTimes(HUB_EVENTS.length);
    for (const [event, handler] of fake.on.mock.calls) {
      expect(fake.off).toHaveBeenCalledWith(event, handler);
    }
  });

  it('does not create cache entries for events with no cached data', () => {
    const { connection, emit } = createFakeConnection();
    const queryClient = new QueryClient();
    registerHandlers(connection, queryClient);
    HUB_EVENTS.forEach((event) => emit(event, {}));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

type Summary = components['schemas']['IncidentSummaryDto'];
type Paged = components['schemas']['IncidentSummaryDtoPaged'];
type AppStatus = components['schemas']['AppStatusItemDto'];

const summary = (over: Summary = {}): Summary => ({
  id: 'id-1',
  number: 'INC-1',
  title: 'Old title',
  status: 'New',
  updatedAt: '2026-10-12T10:00:00Z',
  rowVersion: 'v1',
  ...over,
});

function setup() {
  const { connection, emit } = createFakeConnection();
  const queryClient = new QueryClient();
  registerHandlers(connection, queryClient);
  return { queryClient, emit };
}

describe('IncidentUpdated', () => {
  it('merges the summary into the detail entry, keeping detail-only fields, without fetching', () => {
    const { queryClient, emit } = setup();
    queryClient.setQueryData(incidentKeys.detail('INC-1'), { ...summary(), description: '<p>kept</p>' });
    const fetchSpy = vi.spyOn(queryClient, 'fetchQuery');
    emit('IncidentUpdated', summary({ status: 'Triaged', updatedAt: '2026-10-12T11:00:00Z' }));
    expect(queryClient.getQueryData(incidentKeys.detail('INC-1'))).toMatchObject({
      status: 'Triaged',
      description: '<p>kept</p>',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(queryClient.isFetching()).toBe(0);
  });

  it('patches the incident in a single-page list and in infinite-query pages', () => {
    const { queryClient, emit } = setup();
    const other = summary({ id: 'id-2', number: 'INC-2' });
    queryClient.setQueryData<Paged>(incidentKeys.list({ a: 1 }), { items: [summary(), other] });
    queryClient.setQueryData<InfiniteData<Paged>>(incidentKeys.list({ a: 2 }), {
      pages: [{ items: [summary()] }, { items: [other] }],
      pageParams: [undefined, 'c'],
    });
    emit('IncidentUpdated', summary({ title: 'New title', updatedAt: '2026-10-12T11:00:00Z' }));
    expect(queryClient.getQueryData<Paged>(incidentKeys.list({ a: 1 }))?.items).toEqual([
      expect.objectContaining({ title: 'New title' }),
      other,
    ]);
    const infinite = queryClient.getQueryData<InfiniteData<Paged>>(incidentKeys.list({ a: 2 }));
    expect(infinite?.pages[0].items?.[0].title).toBe('New title');
    expect(infinite?.pages[1].items).toEqual([other]);
  });

  it('ignores an event older than the cached incident', () => {
    const { queryClient, emit } = setup();
    queryClient.setQueryData(incidentKeys.detail('INC-1'), summary({ title: 'Newer' }));
    emit('IncidentUpdated', summary({ title: 'Stale', updatedAt: '2026-10-12T09:00:00Z' }));
    expect(queryClient.getQueryData<Summary>(incidentKeys.detail('INC-1'))?.title).toBe('Newer');
  });

  it('creates no entries when nothing is cached', () => {
    const { queryClient, emit } = setup();
    emit('IncidentUpdated', summary());
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe('IncidentCreated and DashboardChanged', () => {
  it('invalidate lists and summaries on IncidentCreated, leaving other queries alone', () => {
    const { queryClient, emit } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    emit('IncidentCreated', summary());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: incidentKeys.lists() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dashboardKeys.summaries() });
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('refetches the summary for every range instead of replacing it with the payload', () => {
    const { queryClient, emit } = setup();
    queryClient.setQueryData(dashboardKeys.summary('30d'), { range: '30d', openTotal: 1 });
    emit('DashboardChanged', { range: '7d', openTotal: 99 });
    expect(queryClient.getQueryState(dashboardKeys.summary('30d'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(dashboardKeys.summary('30d'))).toEqual({ range: '30d', openTotal: 1 });
    expect(queryClient.getQueryData(dashboardKeys.summary('7d'))).toBeUndefined();
  });
});

describe('AppStatusChanged', () => {
  const item = (status: AppStatus['status'], id = 'app-1'): AppStatus => ({ application: { id }, status });

  it('replaces the matching item in the app-status cache', () => {
    const { queryClient, emit } = setup();
    queryClient.setQueryData(dashboardKeys.appStatus(), [item('Operational'), item('Operational', 'app-2')]);
    emit('AppStatusChanged', item('Outage'));
    expect(queryClient.getQueryData(dashboardKeys.appStatus())).toEqual([item('Outage'), item('Operational', 'app-2')]);
  });

  it('does nothing without a cached list', () => {
    const { queryClient, emit } = setup();
    emit('AppStatusChanged', item('Outage'));
    expect(queryClient.getQueryData(dashboardKeys.appStatus())).toBeUndefined();
  });
});

describe('query key factories', () => {
  it('nest detail and list keys under their prefixes so setQueriesData can match them', () => {
    expect(incidentKeys.detail('INC-1')).toEqual([...incidentKeys.details(), 'INC-1']);
    expect(incidentKeys.list({ status: 'New' }).slice(0, 2)).toEqual([...incidentKeys.lists()]);
    expect(dashboardKeys.summary('7d').slice(0, 2)).toEqual([...dashboardKeys.summaries()]);
    expect(dashboardKeys.appStatus()[0]).toBe('dashboard');
    expect(notificationKeys.list({ unreadOnly: true }).slice(0, 2)).toEqual([...notificationKeys.lists()]);
  });
});
