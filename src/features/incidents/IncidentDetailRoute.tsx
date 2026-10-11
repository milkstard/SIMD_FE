import { Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/shared/EmptyState';

export default function IncidentDetailRoute() {
  const { number } = useParams();

  return (
    <Stack spacing={4} sx={{ p: 6 }}>
      <Typography variant="titlePage" component="h1">
        Incident{number ? ` ${number}` : ''}
      </Typography>
      <EmptyState title="Coming soon" description="The incident detail screen arrives in FE-07." />
    </Stack>
  );
}
