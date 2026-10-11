import { Stack, Typography } from '@mui/material';
import { EmptyState } from '@/shared/EmptyState';

export default function ReportRoute() {
  return (
    <Stack spacing={4} sx={{ p: 6 }}>
      <Typography variant="titlePage" component="h1">
        Report incident
      </Typography>
      <EmptyState title="Coming soon" description="The report form arrives in FE-05." />
    </Stack>
  );
}
