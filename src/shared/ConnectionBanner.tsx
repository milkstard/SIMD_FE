import { Box, Typography } from '@mui/material';
import type { ConnectionState } from '@/realtime/connectionStore';

interface ConnectionBannerProps {
  state: ConnectionState;
  /** Word only (top bar). Without it the detail text shows too (full strip). */
  compact?: boolean;
  /** Announce changes to assistive tech. Only one banner on screen should set this. */
  live?: boolean;
}

const copy: Record<ConnectionState, { word: string; detail: string }> = {
  live: { word: 'Live', detail: 'Updates arrive as they happen.' },
  reconnecting: { word: 'Reconnecting…', detail: 'Changes made by others may be delayed.' },
  offline: {
    word: 'Offline',
    detail: 'Refreshing every 30 seconds until the connection returns.',
  },
};

// The dot shape differs per state (circle / ring / square), so colour is never the only signal.
const dotSx = {
  live: { bgcolor: 'success.main', borderRadius: '50%' },
  reconnecting: { border: 2, borderColor: 'warning.main', borderRadius: '50%' },
  offline: { bgcolor: 'text.secondary', borderRadius: '1px' },
} as const;

const wordColor = {
  live: 'success.main',
  reconnecting: 'warning.main',
  offline: 'text.primary',
} as const;
const background = {
  live: 'transparent',
  reconnecting: 'sevHighTint',
  offline: 'surface200',
} as const;

export function ConnectionBanner({ state, compact = false, live = false }: ConnectionBannerProps) {
  const { word, detail } = copy[state];
  return (
    <Box
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minHeight: 32,
        px: state === 'live' ? 0 : 3,
        borderRadius: '3px',
        bgcolor: background[state],
      }}
    >
      <Box aria-hidden="true" sx={{ width: 8, height: 8, flex: 'none', ...dotSx[state] }} />
      <Typography
        variant="body2"
        component="span"
        sx={{ fontWeight: 600, color: wordColor[state] }}
      >
        {word}
      </Typography>
      {!compact && (
        <Typography variant="body2" component="span" color="text.secondary">
          {detail}
        </Typography>
      )}
    </Box>
  );
}
