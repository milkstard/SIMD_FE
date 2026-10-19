import { currentUser } from '@/test/msw/fixtures';
import { SAVED_VIEWS } from './savedViews';

const filtersOf = (id: string, user = currentUser) => SAVED_VIEWS.find((v) => v.id === id)?.filters(user);

describe('SAVED_VIEWS', () => {
  it('lists the four fixed views in order', () => {
    expect(SAVED_VIEWS.map((v) => v.label)).toEqual(['My incidents', 'My team', 'Unassigned', 'SLA at risk']);
  });

  it('maps each view to its filters', () => {
    expect(filtersOf('mine')).toEqual({ assignee: 'me' });
    expect(filtersOf('unassigned')).toEqual({ assignee: 'unassigned' });
    expect(filtersOf('slaAtRisk')).toEqual({ slaBreached: true });
    expect(filtersOf('team')).toEqual({ teamId: currentUser.teamIds?.[0] });
  });

  it('uses the first team and is unavailable without one', () => {
    expect(filtersOf('team', { ...currentUser, teamIds: ['a-team', 'b-team'] })).toEqual({ teamId: 'a-team' });
    expect(filtersOf('team', { ...currentUser, teamIds: [] })).toBeNull();
  });
});
