import { reportIncidentSchema } from './reportIncident.schema';

const valid = {
  applicationId: 'b3f1c1f0-0000-4000-8000-000000000001',
  environment: 'Production',
  severity: 'High',
  title: 'Checkout fails',
  description: 'Users see a 500.',
};

function messages(input: object) {
  const result = reportIncidentSchema.safeParse({ ...valid, ...input });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('reportIncidentSchema', () => {
  it('accepts a minimal valid report and defaults the optional fields', () => {
    const result = reportIncidentSchema.parse(valid);

    expect(result.stepsToReproduce).toBeNull();
    expect(result.attachmentIds).toEqual([]);
  });

  it('requires application, environment and severity', () => {
    expect(
      messages({ applicationId: '', environment: undefined, severity: undefined }),
    ).toEqual(['Choose an application.', 'Choose an environment.', 'Choose a severity.']);
  });

  it.each([
    ['4 chars', 'abcd', false],
    ['5 chars', 'abcde', true],
    ['200 chars', 'a'.repeat(200), true],
    ['201 chars', 'a'.repeat(201), false],
    ['5 chars padded with spaces', '  abc  ', false],
  ])('title: %s', (_label, title, ok) => {
    expect(messages({ title }).length === 0).toBe(ok);
  });

  it.each([
    ['empty', '', false],
    ['whitespace only', '   ', false],
    ['20 000 chars', 'a'.repeat(20_000), true],
    ['20 001 chars', 'a'.repeat(20_001), false],
  ])('description: %s', (_label, description, ok) => {
    expect(messages({ description }).length === 0).toBe(ok);
  });

  it.each([
    ['5 000 chars', 'a'.repeat(5_000), true],
    ['5 001 chars', 'a'.repeat(5_001), false],
  ])('steps to reproduce: %s', (_label, stepsToReproduce, ok) => {
    expect(messages({ stepsToReproduce }).length === 0).toBe(ok);
  });

  it('turns blank steps into null', () => {
    expect(reportIncidentSchema.parse({ ...valid, stepsToReproduce: '  ' }).stepsToReproduce).toBeNull();
  });

  it.each([
    [10, true],
    [11, false],
  ])('attachmentIds: %i ids', (count, ok) => {
    const attachmentIds = Array.from({ length: count }, (_, i) => `id-${i}`);

    expect(messages({ attachmentIds }).length === 0).toBe(ok);
  });
});
