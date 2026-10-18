import ChangeHistoryOutlined from '@mui/icons-material/ChangeHistoryOutlined';
import DiamondOutlined from '@mui/icons-material/DiamondOutlined';
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined';
import ReportOutlined from '@mui/icons-material/ReportOutlined';
import { Box, type Theme } from '@mui/material';
import type { ElementType } from 'react';
import type { Severity } from '@/types/severity';

interface SeverityStyle {
  Icon: ElementType;
  ink: (t: Theme) => string;
  tint: (t: Theme) => string;
}

const palette = (t: Theme) => t.vars?.palette ?? t.palette;

// Filled tint + glyph (octagon, triangle, diamond, chevron) + word: never colour alone.
const STYLES: Record<Severity, SeverityStyle> = {
  Critical: {
    Icon: ReportOutlined,
    ink: (t) => palette(t).sevCritical,
    tint: (t) => palette(t).sevCriticalTint,
  },
  High: {
    Icon: ChangeHistoryOutlined,
    ink: (t) => palette(t).sevHigh,
    tint: (t) => palette(t).sevHighTint,
  },
  Medium: {
    Icon: DiamondOutlined,
    ink: (t) => palette(t).sevMedium,
    tint: (t) => palette(t).sevMediumTint,
  },
  Low: {
    Icon: KeyboardArrowDownOutlined,
    ink: (t) => palette(t).sevLow,
    tint: (t) => palette(t).sevLowTint,
  },
};

interface SeverityChipProps {
  severity: Severity;
  /** Only when the column header already says "Severity". */
  compact?: boolean;
}

export function SeverityChip({ severity, compact = false }: SeverityChipProps) {
  const { Icon, ink, tint } = STYLES[severity];

  return (
    <Box
      component="span"
      sx={(t) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: compact ? 1 : 2,
        height: 24,
        borderRadius: '3px',
        bgcolor: tint(t),
        color: ink(t),
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      })}
    >
      <Icon sx={{ fontSize: 16 }} />
      {severity}
    </Box>
  );
}
