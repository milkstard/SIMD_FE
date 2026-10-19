import { Link, Stack, Typography } from '@mui/material';
import { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { incidentPath, isIncidentNumber } from '@/shared/incidentPath';
import { SeverityChip } from '@/shared/SeverityChip';
import { StatusBadge } from '@/shared/StatusBadge';
import { TimeAgo } from '@/shared/TimeAgo';
import { UserAvatar } from '@/shared/UserAvatar';
import { SEVERITIES } from '@/types/severity';
import type { IncidentRow } from './useIncidents';

// A live patch changes `rows`, and the grid then re-invokes every visible cell. The cells below take only
// primitive props and are memoized, so a row whose data did not change does not re-render.

export const NumberCell = memo(function NumberCell({
  number,
  tabIndex,
}: {
  number?: string | null;
  tabIndex: 0 | -1;
}) {
  const label = (
    <Typography variant="monoId" component="span">
      {number}
    </Typography>
  );
  if (!isIncidentNumber(number)) return label;
  return (
    <Link component={RouterLink} to={incidentPath(number)} underline="hover" tabIndex={tabIndex}>
      {label}
    </Link>
  );
});

export const SeverityCell = memo(function SeverityCell({
  severity,
}: {
  severity?: IncidentRow['severity'];
}) {
  return severity && SEVERITIES.includes(severity) ? <SeverityChip severity={severity} /> : null;
});

export const StatusCell = memo(function StatusCell({ status }: { status?: IncidentRow['status'] }) {
  return status ? <StatusBadge status={status} /> : null;
});

export const AssigneeCell = memo(function AssigneeCell({ name }: { name?: string | null }) {
  if (!name) {
    return (
      <Typography variant="body2" color="text.secondary">
        Unassigned
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', height: '100%' }}>
      <UserAvatar name={name} decorative />
      <Typography variant="body2" noWrap>
        {name}
      </Typography>
    </Stack>
  );
});

export const UpdatedCell = memo(function UpdatedCell({ value }: { value?: string | null }) {
  return <TimeAgo value={value} />;
});
