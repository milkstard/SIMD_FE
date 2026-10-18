import type { components } from '@/api/generated/schema';

export type Severity = components['schemas']['Severity'];
export type Environment = components['schemas']['AppEnvironment'];

/** Most urgent first. */
export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const satisfies readonly Severity[];

export const ENVIRONMENTS = [
  'Production',
  'UAT',
  'Development',
] as const satisfies readonly Environment[];
