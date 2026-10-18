import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import FiberManualRecordOutlined from '@mui/icons-material/FiberManualRecordOutlined';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import ReplayOutlined from '@mui/icons-material/ReplayOutlined';
import { Box, type Theme } from '@mui/material';
import type { ElementType } from 'react';
import { STATUS_LABELS, type IncidentStatus } from '@/types/workflow';

const palette = (t: Theme) => t.vars?.palette ?? t.palette;

interface StatusStyle {
  Icon: ElementType;
  glyph: (t: Theme) => string;
}

// Outlined badge, ink text: only the glyph takes colour. Never colour alone: glyph + word.
const STYLES: Record<IncidentStatus, StatusStyle> = {
  New: { Icon: FiberManualRecordOutlined, glyph: (t) => palette(t).primary.main },
  Triaged: { Icon: FlagOutlined, glyph: (t) => palette(t).primary.main },
  InProgress: { Icon: PlayCircleOutlined, glyph: (t) => palette(t).primary.main },
  OnHold: { Icon: PauseCircleOutlined, glyph: (t) => palette(t).sevMedium },
  Resolved: { Icon: CheckCircleOutlined, glyph: (t) => palette(t).success.main },
  Reopened: { Icon: ReplayOutlined, glyph: (t) => palette(t).sevHigh },
  Closed: { Icon: LockOutlined, glyph: (t) => palette(t).text.secondary },
};

// The API may send a status this build does not know (version skew); show it plainly instead of crashing the page.
const UNKNOWN: StatusStyle = { Icon: HelpOutlineOutlined, glyph: (t) => palette(t).text.secondary };

export function StatusBadge({ status }: { status: IncidentStatus }) {
  // Own-property check: a plain `??` would let keys like "constructor" through from the prototype chain.
  const { Icon, glyph } = Object.hasOwn(STYLES, status) ? STYLES[status] : UNKNOWN;

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
        border: 1,
        borderColor: palette(t).lineStrong,
        color: palette(t).text.primary,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      })}
    >
      <Icon sx={(t: Theme) => ({ fontSize: 16, color: glyph(t) })} />
      {Object.hasOwn(STATUS_LABELS, status) ? STATUS_LABELS[status] : status}
    </Box>
  );
}
