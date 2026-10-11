import { Box, Link as MuiLink, Typography } from '@mui/material';
import { NavLink, Link as RouterLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Monitor', end: true },
  { to: '/incidents', label: 'Incidents', end: false },
  { to: '/admin', label: 'Admin', end: false },
] as const;

export function NavRail() {
  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        flex: '1 1 232px',
        maxWidth: { sm: 232 },
        bgcolor: 'nav.ground',
        color: 'nav.ink',
        display: 'flex',
        flexDirection: 'column',
        '& :focus-visible': {
          outlineColor: (t) => t.vars?.palette.focusOnNav ?? t.palette.focusOnNav,
        },
      }}
    >
      <MuiLink
        component={RouterLink}
        to="/"
        underline="none"
        sx={{ color: 'nav.ink', px: 5, height: 48, display: 'flex', alignItems: 'center' }}
      >
        <Typography component="span" sx={{ fontWeight: 600, fontSize: 18 }}>
          IncidentHub
        </Typography>
      </MuiLink>
      {items.map(({ to, label, end }) => (
        <MuiLink
          key={to}
          component={NavLink}
          to={to}
          end={end}
          underline="none"
          sx={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 44,
            px: 5,
            color: 'nav.inkMuted',
            borderLeft: '3px solid transparent',
            '&.active': {
              color: 'nav.ink',
              fontWeight: 600,
              borderLeftColor: (t) => t.vars?.palette.focusOnNav ?? t.palette.focusOnNav,
            },
          }}
        >
          {label}
        </MuiLink>
      ))}
    </Box>
  );
}
