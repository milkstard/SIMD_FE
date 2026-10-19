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

/**
 * What a saved draft may contain: the same types, enums and maximums as the form, but no minimums,
 * because a half-written report is exactly what a draft is. Files and `attachmentIds` are never saved.
 */
export const reportDraftSchema = z
  .object({
    applicationId: z.string().max(100),
    environment: z.enum(ENVIRONMENTS),
    severity: z.enum(SEVERITIES),
    title: z.string().max(TITLE_MAX),
    description: z.string().max(DESCRIPTION_MAX),
    stepsToReproduce: z.string().max(STEPS_MAX),
  })
  .partial();

export type ReportDraft = z.infer<typeof reportDraftSchema>;

export const reportDraftFields = Object.keys(reportDraftSchema.shape) as (keyof ReportDraft)[];

export const REPORT_DEFAULTS: Partial<ReportIncidentInput> = {
  applicationId: '',
  title: '',
  description: '',
  stepsToReproduce: '',
  attachmentIds: [],
};

export type ReportIncidentInput = z.input<typeof reportIncidentSchema>;
export type ReportIncidentValues = z.output<typeof reportIncidentSchema>;

export const reportIncidentFields = Object.keys(reportIncidentSchema.shape);

export function toRequest(values: ReportIncidentValues): components['schemas']['ReportIncidentRequest'] {
  return values;
}
