import type { AuthError } from '@azure/msal-browser';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { BuildingIcon, ClockIcon, LockIcon, OctagonIcon } from './icons';

export type SignInState = 'signIn' | 'signingIn' | 'denied' | 'expired';

interface SignInCardProps {
  state: SignInState;
  error: AuthError | null;
  hasDraft?: boolean;
  onSignIn?: () => void;
}

export function SignInCard({ state, error, hasDraft = false, onSignIn }: SignInCardProps) {
  if (state === 'signingIn') return <SigningIn />;

  const denied = state === 'denied';
  const expired = state === 'expired';
  return (
    <>
      {expired && <ExpiredNote hasDraft={hasDraft} />}
      {denied && error && <AccessDenied error={error} />}
      {!denied && !expired && error && (
        <Typography role="alert" variant="body2" color="error">
          Sign-in didn&apos;t finish. Try again. <TraceText error={error} />
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="titlePage">
          {denied ? 'Try a different account' : expired ? 'Sign in again' : 'Sign in to IncidentHub'}
        </Typography>
        <Typography color="text.secondary">
          Use your work account. You&apos;ll go to Microsoft to sign in, then come straight back here.
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<BuildingIcon />}
        onClick={onSignIn}
      >
        {denied ? 'Sign in with another Microsoft account' : 'Sign in with Microsoft'}
      </Button>
      <Box sx={{ display: 'flex', gap: 2.5, color: 'text.secondary' }}>
        <LockIcon />
        <Typography variant="caption">
          Single sign-on through Microsoft Entra ID. IncidentHub never sees your password, and your
          role comes from your Entra groups.
        </Typography>
      </Box>
    </>
  );
}

function SigningIn() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        pt: 6,
        pb: 2,
        textAlign: 'center',
      }}
    >
      <CircularProgress size={40} thickness={4} aria-label="Signing you in" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="heading" component="h1">
          Signing you in…
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Finishing sign-in with Microsoft. This takes a few seconds. Keep this tab open.
        </Typography>
      </Box>
    </Box>
  );
}

function ExpiredNote({ hasDraft }: { hasDraft: boolean }) {
  return (
    <Box
      role="status"
      sx={{ display: 'flex', gap: 2.5, p: 3, borderRadius: '3px', bgcolor: 'brandTint', color: 'text.primary' }}
    >
      <ClockIcon />
      <Typography variant="body2">
        Your session ended. Sign in again to carry on.
        {hasDraft && ' Your unsent report draft is still saved on this device.'}
      </Typography>
    </Box>
  );
}

function AccessDenied({ error }: { error: AuthError }) {
  return (
    <Box
      role="alert"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        borderRadius: '3px',
        bgcolor: 'sevCriticalTint',
        color: 'text.primary',
      }}
    >
      <Typography
        variant="body2"
        sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600, color: 'error.main' }}
      >
        <OctagonIcon />
        We couldn&apos;t sign you in
      </Typography>
      <Typography variant="body2">
        Your Microsoft account isn&apos;t in an IncidentHub group yet. Ask your team lead or the
        service desk to add you, then try again.
      </Typography>
      <TraceText error={error} />
    </Box>
  );
}

function TraceText({ error }: { error: AuthError }) {
  const parts = [error.errorCode, error.correlationId && `trace ${error.correlationId}`];
  return (
    <Typography variant="monoId" sx={{ fontSize: 12, color: 'text.secondary' }}>
      {parts.filter(Boolean).join(' · ')}
    </Typography>
  );
}
