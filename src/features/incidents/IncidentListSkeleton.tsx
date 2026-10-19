import { Skeleton, Stack } from '@mui/material';

export function IncidentListSkeleton() {
  return (
    <Stack spacing={2} role="status" aria-label="Loading incidents">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={48} />
      ))}
    </Stack>
  );
}
