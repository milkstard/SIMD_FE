import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select } from '@mui/material';
import type { ReactNode } from 'react';

interface FilterMultiSelectProps<T extends string> {
  label: string;
  options: readonly T[];
  value: readonly T[];
  onChange: (value: T[]) => void;
  /** Text for the closed control, e.g. "3 selected" or the option words. */
  renderSummary: (value: readonly T[]) => string;
  /** The option content: StatusBadge / SeverityChip carry the glyph and word. */
  renderOption: (option: T) => ReactNode;
  optionLabel: (option: T) => string;
}

export function FilterMultiSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  renderSummary,
  renderOption,
  optionLabel,
}: FilterMultiSelectProps<T>) {
  const labelId = `filter-${label.toLowerCase()}-label`;

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select<T[]>
        labelId={labelId}
        label={label}
        multiple
        value={[...value]}
        onChange={(event) => {
          const next = event.target.value;
          onChange(typeof next === 'string' ? (next.split(',') as T[]) : next);
        }}
        renderValue={(selected) => renderSummary(selected)}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option} aria-label={optionLabel(option)}>
            <Checkbox checked={value.includes(option)} tabIndex={-1} disableRipple />
            <ListItemText disableTypography>{renderOption(option)}</ListItemText>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
