import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';
import type { ReportControl } from './reportFormTypes';

export function TitleField({ control }: { control: ReportControl }) {
  return (
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
  );
}
