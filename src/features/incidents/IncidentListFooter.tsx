import { Alert, Box, Button, LinearProgress } from '@mui/material';

export interface IncidentListFooterProps {
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onRetry: () => void;
}

/** Grid footer: progress while a cursor page loads, an inline retry when it fails, nothing at the end. */
export function IncidentListFooter({
  isFetchingNextPage,
  isFetchNextPageError,
  onRetry,
}: IncidentListFooterProps) {
  if (isFetchNextPageError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry} disabled={isFetchingNextPage}>
            Retry
          </Button>
        }
      >
        The next incidents could not be loaded.
      </Alert>
    );
  }
  if (isFetchingNextPage) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress aria-label="Loading more incidents" />
      </Box>
    );
  }
  return null;
}
