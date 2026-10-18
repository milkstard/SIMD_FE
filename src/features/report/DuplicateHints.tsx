import { Box, Button, Link, Skeleton, Stack, Typography } from '@mui/material';
import { useWatch } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { incidentPath } from '@/shared/incidentPath';
import { StatusBadge } from '@/shared/StatusBadge';
import type { ReportControl } from './reportFormTypes';
import { useSimilarIncidents, type SimilarIncident } from './useSimilarIncidents';

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

function HintRow({ incident }: { incident: SimilarIncident }) {
  const number = incident.number ?? '';

  return (
    <Stack
      component="li"
      direction="row"
      spacing={2}
      sx={{ alignItems: 'center', py: 1, borderTop: 1, borderColor: 'divider' }}
    >
      <Link
        component={RouterLink}
        to={incidentPath(number)}
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
      >
        <Typography variant="monoId" component="span">
          {number}
        </Typography>
        <Box component="span" sx={visuallyHidden}>
          {' '}
          (opens in a new tab)
        </Box>
      </Link>
      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
        {incident.title}
      </Typography>
      {incident.status && <StatusBadge status={incident.status} />}
    </Stack>
  );
}

/**
 * Open incidents that look like the one being typed. Advisory only: nothing here touches submit.
 * The live region is always mounted so screen readers announce the matches when they appear.
 */
export function DuplicateHints({ control }: { control: ReportControl }) {
  const applicationId = useWatch({ control, name: 'applicationId' }) ?? '';
  const title = useWatch({ control, name: 'title' }) ?? '';
  const { data, isError, isFetching, refetch } = useSimilarIncidents(applicationId, title);

  let content = null;
  if (isError) {
    content = (
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Couldn't check for similar incidents.
        </Typography>
        <Button size="small" onClick={() => void refetch()}>
          Try again
        </Button>
      </Stack>
    );
  } else if (isFetching && !data) {
    content = (
      <Stack spacing={1} role="status" aria-label="Looking for similar incidents">
        <Skeleton variant="rounded" height={24} />
        <Skeleton variant="rounded" height={24} />
      </Stack>
    );
  } else if (data && data.length > 0) {
    content = (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ pb: 1 }}>
          Possibly the same problem
        </Typography>
        <Stack component="ul" aria-label="Similar open incidents" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {data.map((incident) => (
            <HintRow key={incident.id ?? incident.number} incident={incident} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box aria-live="polite" data-testid="duplicate-hints">
      {content}
    </Box>
  );
}
