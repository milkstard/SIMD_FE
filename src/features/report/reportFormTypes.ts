import type { Control } from 'react-hook-form';
import type { ReportIncidentInput, ReportIncidentValues } from './reportIncident.schema';

export type ReportControl = Control<ReportIncidentInput, unknown, ReportIncidentValues>;
