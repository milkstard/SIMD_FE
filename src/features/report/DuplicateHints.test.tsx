import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { catalogApp, checkoutApp, similarIncidents } from '@/test/msw/fixtures';
import { mockAuth, renderAtReport } from '@/test/renderWithProviders';
import { ReportIncidentForm } from './ReportIncidentForm';

// Each test selects an application and types through the UI, which is slow on a cold run.
vi.setConfig({ testTimeout: 20_000 });

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

async function typeTitle(title = 'Checkout fails') {
  const user = userEvent.setup();
  renderAtReport(<ReportIncidentForm applications={[checkoutApp, catalogApp]} />);
  await user.click(screen.getByRole('combobox', { name: /^application/i }));
  await user.click(await screen.findByRole('option', { name: /checkout/i }));
  await user.click(screen.getByRole('textbox', { name: /^title/i }));
  await user.paste(title);
  return user;
}

describe('DuplicateHints', () => {
  it('lists up to five matches with number, title, status and a new-tab link', async () => {
    server.use(http.get('*/incidents/similar', () => HttpResponse.json(similarIncidents)));
    await typeTitle();

    const list = await screen.findByRole('list', { name: 'Similar open incidents' });
    const links = await screen.findAllByRole('link', { name: /INC-200\d/ });

    expect(links).toHaveLength(5);
    expect(links[0]).toHaveAttribute('href', '/incidents/INC-2001');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAccessibleName(/opens in a new tab/);
    expect(list).toHaveTextContent('Checkout error variant 1');
    expect(list).toHaveTextContent('In progress');
    expect(screen.getByTestId('duplicate-hints')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders nothing when there are no matches', async () => {
    await typeTitle();

    await vi.waitFor(() => expect(screen.getByTestId('duplicate-hints')).toBeEmptyDOMElement());
    expect(screen.queryByRole('list', { name: 'Similar open incidents' })).not.toBeInTheDocument();
  });

  it('shows a quiet message with retry when the request fails', async () => {
    let calls = 0;
    server.use(
      http.get('*/incidents/similar', () => {
        calls++;
        return calls === 1 ? new HttpResponse(null, { status: 400 }) : HttpResponse.json(similarIncidents);
      }),
    );
    const user = await typeTitle();

    expect(await screen.findByText("Couldn't check for similar incidents.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('list', { name: 'Similar open incidents' })).toBeInTheDocument();
  });
});
