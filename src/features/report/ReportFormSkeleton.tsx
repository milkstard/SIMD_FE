import { Skeleton, Stack } from '@mui/material';

export function ReportFormSkeleton() {
  return (
    <Stack spacing={4} role="status" aria-label="Loading the report form">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
        <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
      </Stack>
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={56} />
      <Skeleton variant="rounded" height={120} />
    </Stack>
  );
}
