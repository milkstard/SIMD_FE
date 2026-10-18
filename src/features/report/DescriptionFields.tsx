import { Stack, TextField } from '@mui/material';
import { Controller } from 'react-hook-form';
import type { ReportControl } from './reportFormTypes';

/** Plain multi-line inputs: the server sanitizes HTML, no rich-text editor in this slice (D-17). */
export function DescriptionFields({ control }: { control: ReportControl }) {
  return (
    <Stack spacing={4}>
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            required
            fullWidth
            label="Title"
            error={fieldState.invalid}
            helperText={fieldState.error?.message ?? 'A short summary of what is wrong.'}
          />
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            required
            fullWidth
            multiline
            minRows={4}
            label="Description"
            error={fieldState.invalid}
            helperText={fieldState.error?.message ?? 'What happened, and who or what is affected?'}
          />
        )}
      />
      <Controller
        name="stepsToReproduce"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            fullWidth
            multiline
            minRows={3}
            label="Steps to reproduce"
            error={fieldState.invalid}
            helperText={fieldState.error?.message}
          />
        )}
      />
    </Stack>
  );
}
