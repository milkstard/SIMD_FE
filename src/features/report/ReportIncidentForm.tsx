import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { incidentPath, isIncidentNumber } from '@/shared/incidentPath';
import { useToast } from '@/shared/toast/useToast';
import { ApplicationFields } from './ApplicationFields';
import { AttachmentDropzone } from './AttachmentDropzone';
import { DescriptionFields } from './DescriptionFields';
import { DiscardDraftButton, DraftRestoredNotice } from './DraftControls';
import { DuplicateHints } from './DuplicateHints';
import { SeverityField } from './SeverityField';
import { TitleField } from './TitleField';
import {
  REPORT_DEFAULTS,
  reportIncidentSchema,
  toRequest,
  type ReportIncidentInput,
  type ReportIncidentValues,
} from './reportIncident.schema';
import type { Application } from '@/shared/hooks/useApplications';
import { handleSubmitError } from './reportSubmitError';
import { useIdempotencyKey } from './useIdempotencyKey';
import { useReportDraft } from './useReportDraft';
import { useReportIncident } from './useReportIncident';

const WAIT_FOR_UPLOADS = 'Wait for the uploads to finish.';

/** Discarding the draft remounts the form so every field, the attachment list and the errors start empty. */
export function ReportIncidentForm({ applications }: { applications: Application[] }) {
  const [formKey, setFormKey] = useState(0);
  return (
    <ReportFormBody
      key={formKey}
      applications={applications}
      focusOnMount={formKey > 0}
      onDiscarded={() => setFormKey((key) => key + 1)}
    />
  );
}

interface ReportFormBodyProps {
  applications: Application[];
  /** Put focus on the (emptied) form: the Discard button that held it is gone after the remount. */
  focusOnMount: boolean;
  onDiscarded: () => void;
}

function ReportFormBody({ applications, focusOnMount, onDiscarded }: ReportFormBodyProps) {
  const navigate = useNavigate();
  const showToast = useToast();
  const mutation = useReportIncident();
  const idempotencyKey = useIdempotencyKey();
  // Synchronous guard: `mutation.isPending` is stale until the next render, so a fast double-click
  // could still start a second request.
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [duplicateNumber, setDuplicateNumber] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit, setError, resetField, reset } = useForm<
    ReportIncidentInput,
    unknown,
    ReportIncidentValues
  >({
    resolver: zodResolver(reportIncidentSchema),
    defaultValues: REPORT_DEFAULTS,
  });
  const draft = useReportDraft({ control, reset, applications });

  useEffect(() => {
    if (focusOnMount) formRef.current?.focus();
  }, [focusOnMount]);

  // The close button that held focus unmounts with the notice, so focus would fall to <body>.
  function dismissRestored() {
    draft.dismissRestored();
    formRef.current?.focus();
  }

  function discardDraft() {
    draft.clear();
    showToast({ message: 'Draft discarded', severity: 'info' });
    onDiscarded();
  }

  // The "wait" message is only true while uploads run, so drop it as soon as they finish.
  const handleUploadingChange = useCallback((pending: boolean) => {
    setUploading(pending);
    if (!pending) setFormErrors((errors) => errors.filter((message) => message !== WAIT_FOR_UPLOADS));
  }, []);

  // Editing after a failed attempt starts a new attempt, so it gets a new idempotency key.
  const { reset: resetKey } = idempotencyKey;
  useEffect(() => resetKey(), [draft.values, resetKey]);

  async function submit(values: ReportIncidentValues) {
    if (inFlight.current) return;
    if (uploading) {
      setFormErrors([WAIT_FOR_UPLOADS]);
      return;
    }
    inFlight.current = true;
    setFormErrors([]);
    setDuplicateNumber(null);
    try {
      const incident = await mutation.mutateAsync({
        body: toRequest(values),
        idempotencyKey: idempotencyKey.current(),
      });
      idempotencyKey.reset();
      draft.clear(); // only a created incident clears the draft; every failure above keeps it
      if (isIncidentNumber(incident.number)) {
        navigate(incidentPath(incident.number));
      } else {
        // Created, but the response has no usable number: send the user to the list instead.
        showToast({ message: 'Incident reported. Find it in the incident list.', severity: 'info' });
        navigate('/incidents');
      }
    } catch (error) {
      handleSubmitError(error, { showToast, setError, setFormErrors, setDuplicateNumber });
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <Box
      component="form"
      ref={formRef}
      tabIndex={-1}
      sx={{ outline: 'none' }}
      noValidate
      onSubmit={(event) => void handleSubmit(submit)(event)}
      aria-label="Report an incident"
    >
      <Stack spacing={5} sx={{ maxWidth: 720 }}>
        {draft.restored && <DraftRestoredNotice onClose={dismissRestored} />}
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
        <Stack spacing={2}>
          <TitleField control={control} />
          <DuplicateHints control={control} />
        </Stack>
        <DescriptionFields control={control} />
        <AttachmentDropzone control={control} onPendingChange={handleUploadingChange} />
        <Stack direction="row" spacing={3}>
          <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>
            {mutation.isPending ? 'Reporting…' : 'Report incident'}
          </Button>
          {draft.hasDraft && (
            <DiscardDraftButton disabled={mutation.isPending} onDiscard={discardDraft} />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
