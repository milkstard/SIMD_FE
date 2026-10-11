import { Box, Typography } from '@mui/material';

// 30 days of decorative uptime tiles, as in the design mock.
const tiles = Array.from({ length: 30 }, (_, i) =>
  i === 9 ? 'error.main' : i === 19 || i === 26 ? 'warning.main' : 'success.main',
);

export function BrandPanel() {
  return (
    <Box
      component="section"
      aria-label="About IncidentHub"
      sx={{
        flex: '1 1 420px',
        bgcolor: 'nav.ground',
        color: 'nav.ink',
        p: 12,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Typography component="span" sx={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
        IncidentHub
      </Typography>
      <Box
        aria-hidden="true"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 2,
          maxWidth: 380,
        }}
      >
        {tiles.map((color, i) => (
          <Box key={i} sx={{ height: 28, borderRadius: '3px', bgcolor: color }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 420 }}>
        <Typography variant="displayKpi" component="h2" sx={{ letterSpacing: '-0.01em' }}>
          Report, track and monitor every incident.
        </Typography>
        <Typography sx={{ color: 'nav.inkMuted' }}>
          One place to raise an incident, follow it to resolution and see the health of every
          application.
        </Typography>
      </Box>
    </Box>
  );
}
