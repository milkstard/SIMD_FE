import { Tooltip } from '@mui/material';
import { formatTimeAgo } from './formatRelativeTime';

const full = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

interface TimeAgoProps {
  /** UTC ISO string from the API. */
  value?: string | null;
}

/** Relative time in the user's locale, with the full local date on hover. */
export function TimeAgo({ value }: TimeAgoProps) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <span>—</span>;

  return (
    <Tooltip title={full.format(date)}>
      <time dateTime={value ?? undefined}>{formatTimeAgo(date)}</time>
    </Tooltip>
  );
}
