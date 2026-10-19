import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeAgo } from './TimeAgo';
import { formatTimeAgo } from './formatRelativeTime';

describe('formatTimeAgo', () => {
  const now = new Date('2026-10-19T12:00:00Z');

  it.each([
    ['2026-10-19T11:59:40Z', 'just now'],
    ['2026-10-19T11:55:00Z', '5 minutes ago'],
    ['2026-10-19T09:00:00Z', '3 hours ago'],
    ['2026-10-18T12:00:00Z', 'yesterday'],
    ['2026-10-19T12:05:00Z', 'just now'],
  ])('%s -> %s', (iso, text) => {
    expect(formatTimeAgo(new Date(iso), now)).toBe(text);
  });
});

describe('TimeAgo', () => {
  it('renders a time element with the ISO value and the full date on hover', async () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    render(<TimeAgo value={iso} />);

    const time = screen.getByText('5 minutes ago');
    expect(time).toHaveAttribute('datetime', iso);
    await userEvent.hover(time);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/\d{4}/);
  });

  it.each([undefined, null, 'not a date'])('shows a dash for %s', (value) => {
    render(<TimeAgo value={value} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
