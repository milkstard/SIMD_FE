import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw/server';
import { catalogApp, checkoutApp } from '@/test/msw/fixtures';
import { mockAuth, renderAtReport } from '@/test/renderWithProviders';
import { SEVERITIES } from '@/types/severity';
import { ReportIncidentForm } from './ReportIncidentForm';
import { SEVERITY_HELP } from './severityHelp';

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

function setup() {
  renderAtReport(<ReportIncidentForm applications={[checkoutApp, catalogApp]} />);
  return userEvent.setup();
}

async function choose(user: ReturnType<typeof userEvent.setup>, field: RegExp, option: RegExp) {
  await user.click(screen.getByRole('combobox', { name: field }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('ReportIncidentForm', () => {
  it('blocks submit and shows field errors without any network call', async () => {
    let requests = 0;
    server.use(
      http.post('*/incidents', () => {
        requests++;
        return new HttpResponse(null, { status: 500 });
      }),
    );
    const user = setup();

    await user.type(screen.getByRole('textbox', { name: /^title/i }), 'abc');
    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('Choose an application.')).toBeInTheDocument();
    expect(screen.getByText('Choose a severity.')).toBeInTheDocument();
    expect(screen.getByText('Title must be at least 5 characters.')).toBeInTheDocument();
    expect(screen.getByText('Describe the problem.')).toBeInTheDocument();
    expect(requests).toBe(0);
  });

  it('flags a title over 200 characters', async () => {
    const user = setup();

    await user.click(screen.getByRole('textbox', { name: /^title/i }));
    await user.paste('a'.repeat(201));
    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('Title must be at most 200 characters.')).toBeInTheDocument();
  });

  it('offers only the environments of the chosen application and resets on change', async () => {
    const user = setup();
    const environment = screen.getByRole('combobox', { name: /^environment/i });
    expect(environment).toHaveAttribute('aria-disabled', 'true');

    await choose(user, /^application/i, /checkout/i);
    await user.click(environment);
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Production', 'UAT']);
    await user.click(screen.getByRole('option', { name: 'UAT' }));
    expect(environment).toHaveTextContent('UAT');

    await choose(user, /^application/i, /catalog/i);

    expect(environment).not.toHaveTextContent('UAT');
    await user.click(environment);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Development']);
  });

  it('shows help text for every severity, each labelled with its word', () => {
    setup();

    const group = screen.getByRole('group', { name: /severity/i });
    for (const severity of SEVERITIES) {
      expect(within(group).getByRole('radio', { name: new RegExp(`^${severity}`) })).toBeInTheDocument();
      expect(within(group).getByText(SEVERITY_HELP[severity])).toBeInTheDocument();
    }
  });

  it('reaches every control with the keyboard', async () => {
    const user = setup();

    await user.tab();
    expect(screen.getByRole('combobox', { name: /^application/i })).toHaveFocus();
    await user.tab(); // environment is disabled until an application is chosen
    expect(screen.getAllByRole('radio')[0]).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: /^title/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: /^description/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: /^steps to reproduce/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Report incident' })).toHaveFocus();
  });
});
