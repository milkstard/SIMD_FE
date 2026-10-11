import type { AuthError } from '@azure/msal-browser';
import { Box, Typography } from '@mui/material';
import { BrandPanel } from './BrandPanel';
import { SignInCard, type SignInState } from './SignInCard';

interface SignInPageProps {
  state: SignInState;
  error?: AuthError | null;
  onSignIn?: () => void;
}

export function SignInPage({ state, error = null, onSignIn }: SignInPageProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', bgcolor: 'background.default' }}>
      <BrandPanel />
      <Box
        component="main"
        sx={{
          flex: '1 1 520px',
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 6,
          py: 12,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: '6px',
            p: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <SignInCard state={state} error={error} onSignIn={onSignIn} />
          <Box
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              pt: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Trouble signing in?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New here? Ask your team lead to add you to an IncidentHub group. For anything else,
              contact the IT service desk.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
