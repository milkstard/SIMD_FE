import { Stack, Typography } from '@mui/material';
import { EmptyState } from '@/shared/EmptyState';

export default function IncidentListRoute() {
  return (
    <Stack spacing={4} sx={{ p: 6 }}>
      <Typography variant="titlePage" component="h1">
        Incidents
      </Typography>
      <EmptyState title="Coming soon" description="The incident list arrives in FE-06." />
    </Stack>
  );
}
