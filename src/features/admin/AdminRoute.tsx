import { Stack, Typography } from '@mui/material';
import { EmptyState } from '@/shared/EmptyState';

export default function AdminRoute() {
  return (
    <Stack spacing={4} sx={{ p: 6 }}>
      <Typography variant="titlePage" component="h1">
        Admin
      </Typography>
      <EmptyState title="Coming soon" description="Admin screens arrive in FE-13." />
    </Stack>
  );
}
