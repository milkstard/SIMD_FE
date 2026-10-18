import type { Severity } from '@/types/severity';

export const SEVERITY_HELP: Record<Severity, string> = {
  Critical: 'Service is down or data is at risk for many users. Needs immediate attention.',
  High: 'A major function is broken and there is no workaround.',
  Medium: 'Something is degraded, but a workaround exists.',
  Low: 'Minor or cosmetic issue with little user impact.',
};
