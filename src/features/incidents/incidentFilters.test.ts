import { normalizeFilters, toIncidentQuery } from './incidentFilters';

describe('toIncidentQuery', () => {
  it('defaults to newest first with a page size and no cursor', () => {
    const query = toIncidentQuery({});
    expect(query.get('sort')).toBe('-createdAt');
    expect(query.get('limit')).toBe('50');
    expect(query.has('cursor')).toBe(false);
    expect([...query.keys()].sort()).toEqual(['limit', 'sort']);
  });

  it('repeats status and severity', () => {
    const query = toIncidentQuery({ status: ['New', 'Triaged'], severity: ['Critical', 'High'] });
    expect(query.getAll('status')).toEqual(['New', 'Triaged']);
    expect(query.getAll('severity')).toEqual(['Critical', 'High']);
  });

  it.each(['me', 'unassigned'] as const)('maps assignee %s to assigneeId', (assignee) => {
    expect(toIncidentQuery({ assignee }).get('assigneeId')).toBe(assignee);
  });

  it('maps the single-value filters', () => {
    const query = toIncidentQuery({
      applicationId: 'app-1',
      teamId: 'team-1',
      slaBreached: true,
      q: ' checkout ',
      sort: 'severity',
    });
    expect(query.get('applicationId')).toBe('app-1');
    expect(query.get('teamId')).toBe('team-1');
    expect(query.get('slaBreached')).toBe('true');
    expect(query.get('q')).toBe('checkout');
    expect(query.get('sort')).toBe('severity');
  });

  it('omits empty values and slaBreached=false', () => {
    const query = toIncidentQuery({
      status: [],
      severity: [],
      applicationId: '',
      teamId: '  ',
      q: '   ',
      slaBreached: false,
    });
    expect([...query.keys()].sort()).toEqual(['limit', 'sort']);
  });

  it('does not send a search over 200 characters', () => {
    expect(toIncidentQuery({ q: 'a'.repeat(200) }).get('q')).toHaveLength(200);
    expect(toIncidentQuery({ q: 'a'.repeat(201) }).has('q')).toBe(false);
  });
});

describe('normalizeFilters', () => {
  it('gives equivalent filters one shape', () => {
    expect(normalizeFilters({ status: [], q: '' })).toEqual(normalizeFilters({}));
    expect(normalizeFilters({ status: ['Triaged', 'New'] })).toEqual(
      normalizeFilters({ status: ['New', 'Triaged', 'New'] }),
    );
  });
});
