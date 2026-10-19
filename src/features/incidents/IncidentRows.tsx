import { Alert, Button, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { incidentPath, isIncidentNumber } from '@/shared/incidentPath';
import { SeverityChip } from '@/shared/SeverityChip';
import { StatusBadge } from '@/shared/StatusBadge';
import { SEVERITIES } from '@/types/severity';
import type { IncidentRow } from './useIncidents';

function Row({ incident }: { incident: IncidentRow }) {
  const { number, title, severity, status } = incident;

  return (
    <Stack
      component="li"
      direction="row"
      spacing={3}
      sx={{ alignItems: 'center', py: 2, borderTop: 1, borderColor: 'divider' }}
    >
      {isIncidentNumber(number) ? (
        <Link component={RouterLink} to={incidentPath(number)} underline="hover">
          <Typography variant="monoId" component="span">
            {number}
          </Typography>
        </Link>
      ) : (
        <Typography variant="monoId" component="span">
          {number}
        </Typography>
      )}
      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
        {title}
      </Typography>
      {severity && SEVERITIES.includes(severity) && <SeverityChip severity={severity} />}
      {status && <StatusBadge status={status} />}
    </Stack>
  );
}

interface IncidentRowsProps {
  rows: IncidentRow[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
}

/** Interim list until the DataGrid arrives in FE-06.03. */
export function IncidentRows({
  rows,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: IncidentRowsProps) {
  return (
    <Stack spacing={3}>
      <Stack component="ul" aria-label="Incidents" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {rows.map((incident) => (
          <Row key={incident.id ?? incident.number} incident={incident} />
        ))}
      </Stack>
      {isFetchNextPageError && (
        <Alert severity="error">The next incidents could not be loaded.</Alert>
      )}
      {hasNextPage && (
        <Button variant="outlined" onClick={onLoadMore} disabled={isFetchingNextPage} sx={{ alignSelf: 'center' }}>
          {isFetchNextPageError ? 'Retry' : 'Load more'}
        </Button>
      )}
    </Stack>
  );
}
