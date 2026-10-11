import { Box, Skeleton, Stack } from '@mui/material';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';

function RouteSkeleton() {
  return (
    <Stack spacing={4} sx={{ p: 6 }} aria-busy="true" aria-label="Loading screen">
      <Skeleton variant="text" width={240} height={32} />
      <Skeleton variant="rounded" height={160} />
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Skeleton variant="rounded" height={96} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={96} sx={{ flex: 1 }} />
      </Box>
    </Stack>
  );
}

/** Root layout route: the app shell around the active screen. */
export function RootLayout() {
  return (
    <AppLayout>
      <Suspense fallback={<RouteSkeleton />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}
