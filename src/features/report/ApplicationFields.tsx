import { MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useWatch, type UseFormResetField } from 'react-hook-form';
import type { ReportIncidentInput } from './reportIncident.schema';
import type { ReportControl } from './reportFormTypes';
import type { Application } from './useApplications';

interface ApplicationFieldsProps {
  control: ReportControl;
  resetField: UseFormResetField<ReportIncidentInput>;
  applications: Application[];
}

/** Application select and the environment select, which only offers the application's environments. */
export function ApplicationFields({ control, resetField, applications }: ApplicationFieldsProps) {
  const applicationId = useWatch({ control, name: 'applicationId' });
  const environments = applications.find((app) => app.id === applicationId)?.environments ?? [];

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
      <Controller
        name="applicationId"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            select
            required
            fullWidth
            label="Application"
            inputRef={field.ref}
            name={field.name}
            value={field.value ?? ''}
            onBlur={field.onBlur}
            onChange={(event) => {
              field.onChange(event);
              resetField('environment');
            }}
            error={fieldState.invalid}
            helperText={fieldState.error?.message}
          >
            {applications.map((app) => (
              <MenuItem key={app.id} value={app.id}>
                {app.name} ({app.code})
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="environment"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            select
            required
            fullWidth
            label="Environment"
            inputRef={field.ref}
            name={field.name}
            value={field.value ?? ''}
            onBlur={field.onBlur}
            onChange={field.onChange}
            disabled={!applicationId}
            error={fieldState.invalid}
            helperText={
              fieldState.error?.message ?? (applicationId ? undefined : 'Choose an application first.')
            }
          >
            {environments.map((environment) => (
              <MenuItem key={environment} value={environment}>
                {environment}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Stack>
  );
}
