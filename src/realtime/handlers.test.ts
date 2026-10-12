import { QueryClient } from '@tanstack/react-query';
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

describe('query key factories', () => {
  it('nest detail and list keys under their prefixes so setQueriesData can match them', () => {
    expect(incidentKeys.detail('INC-1')).toEqual([...incidentKeys.details(), 'INC-1']);
    expect(incidentKeys.list({ status: 'New' }).slice(0, 2)).toEqual([...incidentKeys.lists()]);
    expect(dashboardKeys.summary('7d').slice(0, 2)).toEqual([...dashboardKeys.summaries()]);
    expect(dashboardKeys.appStatus()[0]).toBe('dashboard');
    expect(notificationKeys.list({ unreadOnly: true }).slice(0, 2)).toEqual([...notificationKeys.lists()]);
  });
});
