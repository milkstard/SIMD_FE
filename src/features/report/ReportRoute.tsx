import { Alert, Button, Stack, Typography } from '@mui/material';
import { EmptyState } from '@/shared/EmptyState';
import { ReportFormSkeleton } from './ReportFormSkeleton';
import { ReportIncidentForm } from './ReportIncidentForm';
import { useApplications } from './useApplications';

function ReportBody() {
  const { data, isPending, isError, refetch, isFetching } = useApplications();

  if (isPending && !isError) return <ReportFormSkeleton />;

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void refetch()} disabled={isFetching}>
            Retry
          </Button>
        }
      >
        The applications could not be loaded.
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No applications available"
        description="You can report incidents for applications owned by your teams. Ask an admin to add you to a team."
      />
    );
  }

  return <ReportIncidentForm applications={data} />;
}

export default function ReportRoute() {
  return (
    <Stack spacing={4} sx={{ p: 6 }}>
      <Typography variant="titlePage" component="h1">
        Report incident
      </Typography>
      <ReportBody />
    </Stack>
  );
}
