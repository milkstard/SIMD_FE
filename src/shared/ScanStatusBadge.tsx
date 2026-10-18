import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import GppBadOutlined from '@mui/icons-material/GppBadOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import { Box, type Theme } from '@mui/material';
import type { ElementType } from 'react';
import type { components } from '@/api/generated/schema';

export type ScanStatus = components['schemas']['ScanStatus'];

interface ScanStyle {
  Icon: ElementType;
  ink: (t: Theme) => string;
  tint: (t: Theme) => string;
}

const palette = (t: Theme) => t.vars?.palette ?? t.palette;

// Icon + word + tint: never colour alone.
const STYLES: Record<ScanStatus, ScanStyle> = {
  Pending: { Icon: HourglassEmptyOutlined, ink: (t) => palette(t).sevLow, tint: (t) => palette(t).sevLowTint },
  Clean: {
    Icon: CheckCircleOutlined,
    ink: (t) => palette(t).success.main,
    tint: (t) => palette(t).statusOperationalTint,
  },
  Infected: {
    Icon: GppBadOutlined,
    ink: (t) => palette(t).sevCritical,
    tint: (t) => palette(t).sevCriticalTint,
  },
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const { Icon, ink, tint } = STYLES[status];

  return (
    <Box
      component="span"
      sx={(t) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        height: 24,
        borderRadius: 1,
        bgcolor: tint(t),
        color: ink(t),
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      })}
    >
      <Icon sx={{ fontSize: 16 }} />
      {status}
    </Box>
  );
}
