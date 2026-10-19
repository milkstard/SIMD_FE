import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { currentUser, listIncidents } from '@/test/msw/fixtures';
import { mockAuth, renderAtIncidents } from '@/test/renderWithProviders';
import IncidentListRoute from './IncidentListRoute';
import { useIncidentFilterStore } from './incidentFilterStore';

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

/** Records the query of every `GET /incidents` and answers with the fixture rows. */
function spyOnIncidents() {
  const urls: URL[] = [];
  server.use(
    http.get('*/incidents', ({ request }) => {
      urls.push(new URL(request.url));
      return HttpResponse.json({ items: listIncidents.slice(0, 3), nextCursor: null, totalCount: null });
    }),
  );
  return {
    urls,
    last: () => urls[urls.length - 1],
  };
}

async function renderList() {
  const spy = spyOnIncidents();
  const rendered = renderAtIncidents(<IncidentListRoute />);
  await screen.findByRole('grid', { name: 'Incidents' });
  return { ...spy, ...rendered, user: userEvent.setup() };
}

describe('FilterBar', { timeout: 20_000 }, () => {
  it('sends several statuses and severities as repeated params', async () => {
    const { last, user } = await renderList();

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(screen.getByRole('option', { name: 'New' }));
    await user.click(screen.getByRole('option', { name: 'On hold' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(last().searchParams.getAll('status')).toEqual(['New', 'OnHold']));

    await user.click(screen.getByRole('combobox', { name: 'Severity' }));
    await user.click(screen.getByRole('option', { name: 'Critical' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(last().searchParams.getAll('severity')).toEqual(['Critical']));
    expect(last().searchParams.getAll('status')).toEqual(['New', 'OnHold']);
  });

  it('filters by application', async () => {
    const { last, user } = await renderList();

    await user.click(await screen.findByRole('combobox', { name: 'Application' }));
    await user.click(await screen.findByRole('option', { name: 'Catalog' }));

    await waitFor(() => expect(last().searchParams.get('applicationId')).toBe('b3f1c1f0-0000-4000-8000-000000000002'));
  });

  it('maps the toggles to assigneeId=me and slaBreached=true, and clears them', async () => {
    const { last, user } = await renderList();

    await user.click(screen.getByRole('switch', { name: 'Assigned to me' }));
    await waitFor(() => expect(last().searchParams.get('assigneeId')).toBe('me'));

    await user.click(screen.getByRole('switch', { name: 'SLA breached' }));
    await waitFor(() => expect(last().searchParams.get('slaBreached')).toBe('true'));

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => {
      expect(last().searchParams.has('assigneeId')).toBe(false);
      expect(last().searchParams.has('slaBreached')).toBe(false);
    });
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('debounces the search by 400 ms', async () => {
    const { urls } = await renderList();
    const before = urls.length;
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const fakeUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await fakeUser.type(screen.getByRole('searchbox', { name: 'Search' }), 'timeout');

      vi.advanceTimersByTime(399);
      expect(useIncidentFilterStore.getState().filters.q).toBeUndefined();
      expect(urls).toHaveLength(before);

      vi.advanceTimersByTime(2);
      await waitFor(() => expect(useIncidentFilterStore.getState().filters.q).toBe('timeout'));
    } finally {
      vi.useRealTimers();
    }
    await waitFor(() => expect(urls[urls.length - 1].searchParams.get('q')).toBe('timeout'));
    // One request for the settled text, none per keystroke.
    expect(urls).toHaveLength(before + 1);
  });

  it('caps the search at 200 characters', async () => {
    const { last, user } = await renderList();
    const box = screen.getByRole('searchbox', { name: 'Search' });

    await user.click(box);
    await user.paste('x'.repeat(250));

    expect(box).toHaveValue('x'.repeat(200));
    await waitFor(() => expect(last().searchParams.get('q')).toHaveLength(200));
  });

  it('shows the filters set from outside, search text included', async () => {
    const { user } = await renderList();
    await user.click(screen.getByRole('searchbox', { name: 'Search' }));
    await user.paste('boom');
    await waitFor(() => expect(useIncidentFilterStore.getState().filters.q).toBe('boom'));

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
  });

  it('is operable by keyboard', async () => {
    const { last, user } = await renderList();

    await user.tab();
    // Saved views come first, then the bar: walk to the switch and flip it with the space bar.
    const target = screen.getByRole('switch', { name: 'SLA breached' });
    for (let i = 0; i < 20 && document.activeElement !== target; i += 1) await user.tab();
    expect(target).toHaveFocus();

    await user.keyboard(' ');
    await waitFor(() => expect(last().searchParams.get('slaBreached')).toBe('true'));
  });

  it('a view applied right after typing discards the unsettled text', async () => {
    const { urls, user } = await renderList();
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'foo');

    await user.click(screen.getByRole('tab', { name: 'Unassigned' }));

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    // Outlast the debounce: the discarded text must not reach the store or the wire.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(useIncidentFilterStore.getState().filters.q).toBeUndefined();
    expect(useIncidentFilterStore.getState().activeViewId).toBe('unassigned');
    expect(urls.some((url) => url.searchParams.has('q'))).toBe(false);
  });

  it('a view replaces an applied search', async () => {
    const { last, user } = await renderList();
    await user.click(screen.getByRole('searchbox', { name: 'Search' }));
    await user.paste('boom');
    await waitFor(() => expect(last().searchParams.get('q')).toBe('boom'));

    await user.click(screen.getByRole('tab', { name: 'SLA at risk' }));

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    await waitFor(() => expect(last().searchParams.has('q')).toBe(false));
    expect(last().searchParams.get('slaBreached')).toBe('true');
  });

  it('retyping the same text right after Clear applies it again', async () => {
    const { last, user } = await renderList();
    const box = () => screen.getByRole('searchbox', { name: 'Search' });
    await user.click(box());
    await user.paste('abc');
    await waitFor(() => expect(last().searchParams.get('q')).toBe('abc'));

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.click(box());
    await user.paste('abc');

    expect(box()).toHaveValue('abc');
    await waitFor(() => expect(useIncidentFilterStore.getState().filters.q).toBe('abc'));
    await waitFor(() => expect(last().searchParams.get('q')).toBe('abc'));
  });

  it('chooses status options with the keyboard', async () => {
    const { last, user } = await renderList();

    screen.getByRole('combobox', { name: 'Status' }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    // The menu opens with the first option focused.
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(last().searchParams.getAll('status')).toEqual(['New']));
  });

  it('disables the application select while /applications fails', async () => {
    server.use(http.get('*/applications', () => new HttpResponse(null, { status: 500 })));
    await renderList();

    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Application' })).toHaveAttribute('aria-disabled', 'true'));
  });
});

describe('SavedViewTabs', { timeout: 20_000 }, () => {
  it('"SLA at risk" sends slaBreached=true', async () => {
    const { last, user } = await renderList();

    await user.click(screen.getByRole('tab', { name: 'SLA at risk' }));

    await waitFor(() => expect(last().searchParams.get('slaBreached')).toBe('true'));
    expect(last().searchParams.has('assigneeId')).toBe(false);
  });

  it('"My incidents" sends assigneeId=me', async () => {
    const { last, user } = await renderList();

    await user.click(screen.getByRole('tab', { name: 'My incidents' }));

    await waitFor(() => expect(last().searchParams.get('assigneeId')).toBe('me'));
  });

  it('switches views with the arrow keys and Enter', async () => {
    const { last, user } = await renderList();

    await user.click(screen.getByRole('tab', { name: 'My incidents' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'My team' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{Enter}');

    expect(screen.getByRole('tab', { name: 'Unassigned' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(last().searchParams.get('assigneeId')).toBe('unassigned'));
  });

  it('Clear filters after a view returns to the unfiltered request', async () => {
    const { last, user } = await renderList();
    await user.click(screen.getByRole('tab', { name: 'Unassigned' }));
    await waitFor(() => expect(last().searchParams.get('assigneeId')).toBe('unassigned'));

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(last().searchParams.has('assigneeId')).toBe(false));
    expect(useIncidentFilterStore.getState().activeViewId).toBeNull();
  });
  it('switching a view sends one request and stores only filter state', async () => {
    const { urls, user, queryClient } = await renderList();
    const before = urls.length;

    await user.click(screen.getByRole('tab', { name: 'Unassigned' }));

    await waitFor(() => expect(urls).toHaveLength(before + 1));
    expect(urls[urls.length - 1].searchParams.get('assigneeId')).toBe('unassigned');
    expect(screen.getByRole('tab', { name: 'Unassigned' })).toHaveAttribute('aria-selected', 'true');

    const { filters, activeViewId } = useIncidentFilterStore.getState();
    expect({ filters, activeViewId }).toEqual({
      filters: { assignee: 'unassigned', sort: undefined },
      activeViewId: 'unassigned',
    });
    // Server data stays in TanStack Query: nothing but filters in the store.
    expect(Object.keys(useIncidentFilterStore.getState()).sort()).toEqual(
      ['activeViewId', 'applyView', 'filters', 'reset', 'resetKey', 'setFilter', 'setSort'],
    );
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);
  });

  it('"My team" filters on the first team of the user', async () => {
    const { last, user } = await renderList();

    await user.click(screen.getByRole('tab', { name: 'My team' }));

    await waitFor(() => expect(last().searchParams.get('teamId')).toBe(currentUser.teamIds?.[0]));
  });

  it('editing a filter after a view leaves no tab selected', async () => {
    const { user } = await renderList();
    await user.click(screen.getByRole('tab', { name: 'SLA at risk' }));
    expect(screen.getByRole('switch', { name: 'SLA breached' })).toBeChecked();

    await user.click(screen.getByRole('switch', { name: 'Assigned to me' }));

    const tabs = within(screen.getByRole('tablist', { name: 'Saved views' })).getAllByRole('tab');
    expect(tabs.every((tab) => tab.getAttribute('aria-selected') === 'false')).toBe(true);
  });

  it('disables "My team" with a hint when the user has no team', async () => {
    server.use(http.get('*/me', () => HttpResponse.json({ ...currentUser, teamIds: [] })));
    await renderList();

    const tab = await screen.findByRole('tab', { name: 'My team' });
    await waitFor(() => expect(tab).toBeDisabled());
    expect(tab).toHaveAccessibleDescription(/not in a team/i);
  });
});
