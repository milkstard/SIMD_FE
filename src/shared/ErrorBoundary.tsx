import { Alert, AlertTitle, Box, Button, Link, Typography } from '@mui/material';
import {
  Link as RouterLink,
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useRouteError,
} from 'react-router-dom';
import { ApiError } from '@/api/client';

// Vite/Chrome/Firefox and Safari messages for a lazy chunk that failed to download.
const chunkLoadMessage = /dynamically imported module|Importing a module script failed/;

function isChunkLoadError(error: unknown): boolean {
  return error instanceof TypeError && chunkLoadMessage.test(error.message);
}

/** Route-level error element: catches errors from its route's tree and offers an inline retry. */
export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();
  const navigate = useNavigate();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <Box sx={{ p: 6 }}>
        <Alert severity="error">
          <AlertTitle>Page not found</AlertTitle>
          Check the address, or go back to the{' '}
          <Link component={RouterLink} to="/">
            Monitor
          </Link>
          .
        </Alert>
      </Box>
    );
  }

  const apiError = error instanceof ApiError ? error : null;
  const traceId = apiError?.problem?.traceId;
  // A new location (same URL) makes React Router reset this route's boundary; a failed chunk
  // stays cached by React.lazy, so only a full reload fetches it again.
  const retry = () =>
    isChunkLoadError(error) ? window.location.reload() : navigate(location, { replace: true });

  return (
    <Box sx={{ p: 6 }}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            Retry
          </Button>
        }
      >
        <AlertTitle>
          {apiError?.problem?.title ?? 'Something went wrong on this screen.'}
        </AlertTitle>
        Try again. If it keeps happening, contact support.
        {traceId && (
          <Typography variant="monoId" component="p" sx={{ mt: 1 }}>
            Trace ID: {traceId}
          </Typography>
        )}
      </Alert>
    </Box>
  );
}
