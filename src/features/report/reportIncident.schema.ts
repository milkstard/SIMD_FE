import { z } from 'zod';
import type { components } from '@/api/generated/schema';
import { ENVIRONMENTS, SEVERITIES } from '@/types/severity';

// Limits mirror API-CONTRACT §4 (ReportIncidentRequest).
export const TITLE_MIN = 5;
export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 20_000;
export const STEPS_MAX = 5_000;
export const ATTACHMENTS_MAX = 10;

export const reportIncidentSchema = z.object({
  applicationId: z.string().min(1, 'Choose an application.'),
  environment: z.enum(ENVIRONMENTS, { error: 'Choose an environment.' }),
  severity: z.enum(SEVERITIES, { error: 'Choose a severity.' }),
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters.`)
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters.`),
  description: z
    .string()
    .trim()
    .min(1, 'Describe the problem.')
    .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX.toLocaleString('en')} characters.`),
  stepsToReproduce: z
    .string()
    .max(STEPS_MAX, `Steps to reproduce must be at most ${STEPS_MAX.toLocaleString('en')} characters.`)
    .optional()
    .transform((value) => (value?.trim() ? value : null)),
  // Populated by the attachment dropzone (FE-05.02).
  attachmentIds: z
    .array(z.string())
    .max(ATTACHMENTS_MAX, `Attach at most ${ATTACHMENTS_MAX} files.`)
    .default([]),
});

export type ReportIncidentInput = z.input<typeof reportIncidentSchema>;
export type ReportIncidentValues = z.output<typeof reportIncidentSchema>;

export const reportIncidentFields = Object.keys(reportIncidentSchema.shape);

export function toRequest(values: ReportIncidentValues): components['schemas']['ReportIncidentRequest'] {
  return values;
}
