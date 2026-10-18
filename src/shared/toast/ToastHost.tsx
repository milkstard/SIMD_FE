import { Alert, Snackbar, Typography } from '@mui/material';
import { useToastStore } from './toastStore';

/** Single Snackbar host, mounted once in the app layout. */
export function ToastHost() {
  const toast = useToastStore((state) => state.toast);
  const close = useToastStore((state) => state.close);

  return (
    <Snackbar
      key={toast?.id}
      open={toast !== null}
      autoHideDuration={8000}
      onClose={(_event, reason) => {
        if (reason !== 'clickaway') close();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {toast ? (
        <Alert severity={toast.severity} variant="outlined" onClose={close} sx={{ bgcolor: 'background.paper' }}>
          {toast.message}
          {toast.traceId && (
            <Typography variant="monoId" component="span" sx={{ display: 'block' }}>
              Trace ID: {toast.traceId}
            </Typography>
          )}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
