import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { SeverityChip } from '@/shared/SeverityChip';
import { SEVERITIES } from '@/types/severity';
import type { ReportControl } from './reportFormTypes';
import { SEVERITY_HELP } from './severityHelp';

export function SeverityField({ control }: { control: ReportControl }) {
  return (
    <Controller
      name="severity"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl component="fieldset" required error={fieldState.invalid}>
          <FormLabel component="legend">Severity</FormLabel>
          <RadioGroup
            name={field.name}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            sx={{ gap: 2, mt: 2 }}
          >
            {SEVERITIES.map((severity) => (
              <FormControlLabel
                key={severity}
                value={severity}
                control={
                  <Radio
                    slotProps={{
                      input: severity === SEVERITIES[0] ? { ref: field.ref } : undefined,
                    }}
                  />
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
                label={
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, pt: 2 }}>
                    <SeverityChip severity={severity} />
                    <Typography variant="body2" color="text.secondary">
                      {SEVERITY_HELP[severity]}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
          {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
