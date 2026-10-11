import { Stack, Typography } from '@mui/material';
import { EmptyState } from '@/shared/EmptyState';

export default function DashboardRoute() {
  return (
    <Stack spacing={4} sx={{ p: 6 }}>
      <Typography variant="titlePage" component="h1">
        Monitor
      </Typography>
      <EmptyState title="Coming soon" description="The monitoring dashboard arrives in FE-08." />
    </Stack>
  );
}
