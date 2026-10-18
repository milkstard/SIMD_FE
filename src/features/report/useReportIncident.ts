import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { incidentKeys } from '@/api/keys';
import { isIncidentNumber } from '@/shared/incidentPath';

type IncidentDetail = components['schemas']['IncidentDetailDto'];

interface ReportVariables {
  body: components['schemas']['ReportIncidentRequest'];
  idempotencyKey: string;
}

/** `POST /incidents`. The caller owns the idempotency key so a retry of the same attempt reuses it. */
export function useReportIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, idempotencyKey }: ReportVariables) =>
      apiRequest<IncidentDetail>('/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(body),
      }),
    onSuccess: (incident) => {
      if (isIncidentNumber(incident.number)) queryClient.setQueryData(incidentKeys.detail(incident.number), incident);
      void queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}
