import { incidentPath, isIncidentNumber } from './incidentPath';

describe('incidentPath', () => {
  it.each(['INC-1', 'INC-1042'])('accepts %s', (value) => {
    expect(isIncidentNumber(value)).toBe(true);
  });

  it.each(['', 'inc-1', 'INC-', 'INC-1/../admin', 'INC-1?x=1', '/x', 'INC-1#a', 42, null, undefined])(
    'rejects %s',
    (value) => {
      expect(isIncidentNumber(value)).toBe(false);
    },
  );

  it('builds an encoded in-app path', () => {
    expect(incidentPath('INC-1042')).toBe('/incidents/INC-1042');
  });
});
