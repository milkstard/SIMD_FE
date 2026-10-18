import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { incidentPath, isIncidentNumber } from '@/shared/incidentPath';
import { useToast } from '@/shared/toast/useToast';
import { ApplicationFields } from './ApplicationFields';
import { DescriptionFields } from './DescriptionFields';
import { SeverityField } from './SeverityField';
import { applyProblemErrors, getExistingIncidentNumber, problemErrorKeys } from './problemMapping';
import {
  reportIncidentFields,
  reportIncidentSchema,
  toRequest,
  type ReportIncidentInput,
  type ReportIncidentValues,
} from './reportIncident.schema';
import type { Application } from './useApplications';
import { useIdempotencyKey } from './useIdempotencyKey';
import { useReportIncident } from './useReportIncident';

const FALLBACK_ERROR = 'The incident could not be reported. Try again.';

export function ReportIncidentForm({ applications }: { applications: Application[] }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const mutation = useReportIncident();
  const idempotencyKey = useIdempotencyKey();
  // Synchronous guard: `mutation.isPending` is stale until the next render, so a fast double-click
  // could still start a second request.
  const inFlight = useRef(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [duplicateNumber, setDuplicateNumber] = useState<string | null>(null);

  const { control, handleSubmit, setError, resetField } = useForm<
    ReportIncidentInput,
    unknown,
    ReportIncidentValues
  >({
    resolver: zodResolver(reportIncidentSchema),
    defaultValues: {
      applicationId: '',
      title: '',
      description: '',
      stepsToReproduce: '',
      attachmentIds: [],
    },
  });

  // Editing after a failed attempt starts a new attempt, so it gets a new idempotency key.
  const values = useWatch({ control });
  const { reset: resetKey } = idempotencyKey;
  useEffect(() => resetKey(), [values, resetKey]);

  function handleError(error: unknown) {
    if (!(error instanceof ApiError)) {
      showToast({ message: FALLBACK_ERROR, severity: 'error' });
      return;
    }
    const { status, problem } = error;
    const existing = getExistingIncidentNumber(problem);

    // Server text (title/detail) is never shown: fixed copy per status, only 422 field messages come through.
    if (status === 422) {
      const unmapped = applyProblemErrors(problem, setError, reportIncidentFields);
      const mapped = problemErrorKeys(problem).some((key) => reportIncidentFields.includes(key));
      setFormErrors(unmapped.length > 0 || mapped ? unmapped : ['Check the form and try again.']);
    } else if (status === 409 && existing) {
      setDuplicateNumber(existing);
    } else if (status === 413) {
      showToast({ message: 'The report is too large to send.', severity: 'error' });
    } else if (status === 500) {
      showToast({
        message: 'Something went wrong on our side. Quote the trace ID if you contact support.',
        severity: 'error',
        traceId: problem?.traceId,
      });
    } else if (status === 403) {
      showToast({ message: 'You cannot report incidents for this application.', severity: 'error' });
    } else if (status === 429) {
      showToast({ message: 'Too many requests. Wait a moment and try again.', severity: 'warning' });
    } else {
      showToast({ message: FALLBACK_ERROR, severity: 'error' });
    }
  }

  async function submit(values: ReportIncidentValues) {
    if (inFlight.current) return;
    inFlight.current = true;
    setFormErrors([]);
    setDuplicateNumber(null);
    try {
      const incident = await mutation.mutateAsync({
        body: toRequest(values),
        idempotencyKey: idempotencyKey.current(),
      });
      idempotencyKey.reset();
      if (isIncidentNumber(incident.number)) {
        navigate(incidentPath(incident.number));
      } else {
        // Created, but the response has no usable number: send the user to the list instead.
        showToast({ message: 'Incident reported. Find it in the incident list.', severity: 'info' });
        navigate('/incidents');
      }
    } catch (error) {
      handleError(error);
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event) => void handleSubmit(submit)(event)}
      aria-label="Report an incident"
    >
      <Stack spacing={5} sx={{ maxWidth: 720 }}>
        {formErrors.length > 0 && (
          <Alert severity="error">
            <Stack component="ul" sx={{ m: 0, pl: 4 }}>
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </Stack>
          </Alert>
        )}
        {duplicateNumber && (
          <Alert severity="warning">
            An open incident with the same application and title already exists:{' '}
            <Link component={RouterLink} to={incidentPath(duplicateNumber)}>
              <Typography variant="monoId" component="span">
                {duplicateNumber}
              </Typography>
            </Link>
            .
          </Alert>
        )}
        <ApplicationFields control={control} resetField={resetField} applications={applications} />
        <SeverityField control={control} />
        <DescriptionFields control={control} />
        <Box>
          <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>
            {mutation.isPending ? 'Reporting…' : 'Report incident'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
