import { fromSortModel, toSortModel } from './incidentSort';

describe('incidentSort', () => {
  it('maps the server sorts to a grid sort model', () => {
    expect(toSortModel('severity')).toEqual([{ field: 'severity', sort: 'desc' }]);
    expect(toSortModel('-updatedAt')).toEqual([{ field: 'updatedAt', sort: 'desc' }]);
  });

  it('shows no sorted column for the default and created orders', () => {
    expect(toSortModel('-createdAt')).toEqual([]);
    expect(toSortModel('createdAt')).toEqual([]);
  });

  it('maps a grid sort model back to the sort token', () => {
    expect(fromSortModel([{ field: 'severity', sort: 'desc' }])).toBe('severity');
    expect(fromSortModel([{ field: 'updatedAt', sort: 'desc' }])).toBe('-updatedAt');
  });

  it('falls back to the default when cleared or for an unsupported column or direction', () => {
    expect(fromSortModel([])).toBe('-createdAt');
    expect(fromSortModel([{ field: 'title', sort: 'desc' }])).toBe('-createdAt');
    expect(fromSortModel([{ field: 'severity', sort: 'asc' }])).toBe('-createdAt');
  });
});
