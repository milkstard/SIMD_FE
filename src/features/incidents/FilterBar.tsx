import {
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useApplications } from '@/shared/hooks/useApplications';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { SeverityChip } from '@/shared/SeverityChip';
import { StatusBadge } from '@/shared/StatusBadge';
import { SEVERITIES } from '@/types/severity';
import { STATUS_LABELS, type IncidentStatus } from '@/types/workflow';
import { FilterMultiSelect } from './FilterMultiSelect';
import { MAX_QUERY_LENGTH } from './incidentFilters';
import { useIncidentFilterStore } from './incidentFilterStore';

const SEARCH_DEBOUNCE_MS = 400;
const STATUSES = Object.keys(STATUS_LABELS) as IncidentStatus[];

const summarize = (value: readonly string[], labelOf: (v: string) => string) =>
  value.length <= 2 ? value.map(labelOf).join(', ') : `${value.length} selected`;

/** Mounted per `resetKey`: a view or Clear starts it afresh from the store, dropping unsettled text. */
function SearchField() {
  const q = useIncidentFilterStore((s) => s.filters.q);
  const setFilter = useIncidentFilterStore((s) => s.setFilter);
  const [text, setText] = useState(q ?? '');
  const debounced = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  // Push the settled text to the store once the user stops typing.
  useEffect(() => {
    const current = useIncidentFilterStore.getState().filters.q ?? '';
    if (debounced !== current) setFilter('q', debounced || undefined);
  }, [debounced, setFilter]);

  return (
    <TextField
      size="small"
      label="Search"
      type="search"
      value={text}
      onChange={(event) => setText(event.target.value.slice(0, MAX_QUERY_LENGTH))}
      slotProps={{ htmlInput: { maxLength: MAX_QUERY_LENGTH } }}
      sx={{ minWidth: 220 }}
    />
  );
}

export function FilterBar() {
  const filters = useIncidentFilterStore((s) => s.filters);
  const setFilter = useIncidentFilterStore((s) => s.setFilter);
  const reset = useIncidentFilterStore((s) => s.reset);
  const resetKey = useIncidentFilterStore((s) => s.resetKey);
  const applications = useApplications();

  const hasFilters = Object.entries(filters).some(
    ([key, value]) =>
      key !== 'sort' && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0),
  );

  return (
    <Stack
      component="form"
      role="search"
      aria-label="Filter incidents"
      onSubmit={(event) => event.preventDefault()}
      direction="row"
      spacing={3}
      useFlexGap
      sx={{ flexWrap: 'wrap', alignItems: 'center' }}
    >
      <FilterMultiSelect<IncidentStatus>
        label="Status"
        options={STATUSES}
        value={filters.status ?? []}
        onChange={(value) => setFilter('status', value)}
        renderSummary={(value) => summarize(value, (v) => STATUS_LABELS[v as IncidentStatus])}
        renderOption={(status) => <StatusBadge status={status} />}
        optionLabel={(status) => STATUS_LABELS[status]}
      />
      <FilterMultiSelect
        label="Severity"
        options={SEVERITIES}
        value={filters.severity ?? []}
        onChange={(value) => setFilter('severity', value)}
        renderSummary={(value) => summarize(value, (v) => v)}
        renderOption={(severity) => <SeverityChip severity={severity} />}
        optionLabel={(severity) => severity}
      />
      <FormControl size="small" sx={{ minWidth: 180 }} disabled={applications.isPending || applications.isError}>
        <InputLabel id="filter-application-label">Application</InputLabel>
        <Select
          labelId="filter-application-label"
          label="Application"
          value={filters.applicationId ?? ''}
          onChange={(event) => setFilter('applicationId', event.target.value || undefined)}
          displayEmpty
        >
          <MenuItem value="">All applications</MenuItem>
          {(applications.data ?? []).map((app) => (
            <MenuItem key={app.id} value={app.id}>
              {app.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <SearchField key={resetKey} />
      <FormControlLabel
        label="Assigned to me"
        control={
          <Switch
            checked={filters.assignee === 'me'}
            onChange={(event) => setFilter('assignee', event.target.checked ? 'me' : undefined)}
          />
        }
      />
      <FormControlLabel
        label="SLA breached"
        control={
          <Switch
            checked={filters.slaBreached === true}
            onChange={(event) => setFilter('slaBreached', event.target.checked ? true : undefined)}
          />
        }
      />
      <Button variant="text" onClick={reset} disabled={!hasFilters}>
        Clear filters
      </Button>
    </Stack>
  );
}
