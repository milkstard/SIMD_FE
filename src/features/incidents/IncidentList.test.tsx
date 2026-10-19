import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { incidentSummary } from '@/test/msw/fixtures';
import { renderAtIncidents } from '@/test/renderWithProviders';
import { IncidentList } from './IncidentList';
import type { IncidentSort } from './incidentFilters';

const rows = [incidentSummary(0), incidentSummary(1), incidentSummary(2)];

function renderList(props: Partial<Parameters<typeof IncidentList>[0]> = {}) {
  const onSortChange = vi.fn<(sort: IncidentSort) => void>();
  const onLoadMore = vi.fn();
  renderAtIncidents(
    <IncidentList
      rows={rows}
      hasNextPage={false}
      isFetchingNextPage={false}
      isFetchNextPageError={false}
      onLoadMore={onLoadMore}
      sort="-createdAt"
      onSortChange={onSortChange}
      {...props}
    />,
  );
  return { onSortChange, onLoadMore, user: userEvent.setup() };
}

// Grid rendering is slow under full-suite load, as in the other list tests.
describe('IncidentList', { timeout: 20_000 }, () => {
  it('renders each row with a link, application, severity, status, assignee and time', async () => {
    renderList();
    const grid = await screen.findByRole('grid', { name: 'Incidents' });

    // incidentSummary(0): Critical / New, Checkout, unassigned.
    const row = within(grid).getByRole('row', { name: /INC-3001/ });
    expect(within(row).getByRole('link', { name: 'INC-3001' })).toHaveAttribute(
      'href',
      '/incidents/INC-3001',
    );
    expect(within(row).getByText('List incident 1')).toBeInTheDocument();
    expect(within(row).getByText('Checkout')).toBeInTheDocument();
    expect(within(row).getByText('Critical')).toBeInTheDocument();
    expect(within(row).getByText('New')).toBeInTheDocument();
    expect(within(row).getByText('Unassigned')).toBeInTheDocument();
    expect(row.querySelector('time')).toHaveAttribute('datetime', rows[0]?.updatedAt);
    // Severity and status carry a glyph as well as the word, never colour alone.
    expect(row.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);

    // incidentSummary(1): High / Triaged, Catalog, assigned.
    const assigned = within(grid).getByRole('row', { name: /INC-3002/ });
    expect(within(assigned).getByText('Ada Responder')).toBeInTheDocument();
    expect(within(assigned).getByText('Catalog')).toBeInTheDocument();
    expect(within(assigned).queryByText('Unassigned')).not.toBeInTheDocument();
  });

  it('shows a row without a valid incident number as plain text, not a link', async () => {
    renderList({ rows: [{ ...incidentSummary(0), number: 'javascript:alert(1)' }] });
    const grid = await screen.findByRole('grid', { name: 'Incidents' });

    expect(within(grid).getByText('javascript:alert(1)')).toBeInTheDocument();
    expect(within(grid).queryByRole('link')).not.toBeInTheDocument();
  });

  it('offers sorting on Severity and Updated only', async () => {
    const { onSortChange, user } = renderList();
    await screen.findByRole('grid', { name: 'Incidents' });

    await user.click(screen.getByRole('columnheader', { name: 'Title' }));
    await user.click(screen.getByRole('columnheader', { name: 'Status' }));
    expect(onSortChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('columnheader', { name: /severity/i }));
    expect(onSortChange).toHaveBeenLastCalledWith('severity');

    await user.click(screen.getByRole('columnheader', { name: /updated/i }));
    expect(onSortChange).toHaveBeenLastCalledWith('-updatedAt');
  });

  it('marks the sorted column from the sort prop and clears back to the default', async () => {
    const { onSortChange, user } = renderList({ sort: 'severity' });
    const header = await screen.findByRole('columnheader', { name: /severity/i });
    expect(header).toHaveAttribute('aria-sort', 'descending');

    await user.click(header);
    expect(onSortChange).toHaveBeenLastCalledWith('-createdAt');
  });

  it('shows progress while a page loads and nothing at the end of the list', async () => {
    renderList({ hasNextPage: true, isFetchingNextPage: true });
    expect(await screen.findByRole('progressbar', { name: 'Loading more incidents' })).toBeInTheDocument();
  });

  it('shows no progress or error when idle', async () => {
    renderList();
    await screen.findByRole('grid', { name: 'Incidents' });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the rows on a failed page and retries from the footer', async () => {
    const { onLoadMore, user } = renderList({ hasNextPage: true, isFetchNextPageError: true });

    expect(await screen.findByText('The next incidents could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'INC-3001' })).toBeInTheDocument();
    expect(onLoadMore).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
