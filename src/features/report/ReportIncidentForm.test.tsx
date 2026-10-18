import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw/server';
import { pendingAttachment } from '@/test/msw/fixtures';
import { catalogApp, checkoutApp } from '@/test/msw/fixtures';
import { mockAuth, renderAtReport } from '@/test/renderWithProviders';
import { SEVERITIES } from '@/types/severity';
import { ReportIncidentForm } from './ReportIncidentForm';
import { SEVERITY_HELP } from './severityHelp';

// Typing through the UI is slow on a cold run.
vi.setConfig({ testTimeout: 20_000 });

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

function setup() {
  renderAtReport(<ReportIncidentForm applications={[checkoutApp, catalogApp]} />);
  return userEvent.setup();
}

async function choose(user: ReturnType<typeof userEvent.setup>, field: RegExp, option: RegExp) {
  await user.click(await screen.findByRole('combobox', { name: field }));
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
    expect(screen.getByRole('button', { name: 'Choose files' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Report incident' })).toHaveFocus();
  });

  describe('attachments', () => {
    async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
      await choose(user, /^application/i, /checkout/i);
      await choose(user, /^environment/i, /^production$/i);
      await user.click(screen.getByRole('radio', { name: /^high/i }));
      await user.click(screen.getByRole('textbox', { name: /^title/i }));
      await user.paste('Checkout fails after payment');
      await user.click(screen.getByRole('textbox', { name: /^description/i }));
      await user.paste('Users see an error page.');
    }

    const upload = (user: ReturnType<typeof userEvent.setup>, ...files: File[]) =>
      user.upload(screen.getByLabelText('Attachment files'), files);
    // The content doubles as the key the MSW handler reads, since the multipart file name is not reliable in jsdom.
    const png = (name: string) => new File([name], name, { type: 'image/png' });

    it('submits only the ids of uploaded, non-infected files', async () => {
      const idByName: Record<string, string> = { 'good.png': 'id-good', 'bad.png': 'id-bad', 'gone.png': 'id-gone' };
      let body: { attachmentIds?: string[] } | undefined;
      server.use(
        http.post('*/attachments', async ({ request }) => {
          const file = (await request.formData()).get('file') as File;
          const key = await file.text();
          return HttpResponse.json(
            {
              ...pendingAttachment,
              id: idByName[key],
              fileName: key,
              scanStatus: key === 'bad.png' ? 'Infected' : 'Pending',
            },
            { status: 201 },
          );
        }),
        http.post('*/incidents', async ({ request }) => {
          body = (await request.json()) as typeof body;
          return HttpResponse.json({ number: 'INC-1042' }, { status: 201 });
        }),
      );
      const user = userEvent.setup({ applyAccept: false });
      renderAtReport(<ReportIncidentForm applications={[checkoutApp, catalogApp]} />);
      await fillRequiredFields(user);

      await upload(user, png('good.png'), png('bad.png'), png('gone.png'));
      await screen.findByText('Infected');
      await user.click(await screen.findByRole('button', { name: 'Remove gone.png' }));
      await user.click(screen.getByRole('button', { name: 'Report incident' }));

      expect(await screen.findByText('Incident page INC-1042')).toBeInTheDocument();
      expect(body?.attachmentIds).toEqual(['id-good']);
    }, 20_000);

    it('blocks submit while an upload is running and clears the message when it finishes', async () => {
      let requests = 0;
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => (release = resolve));
      server.use(
        http.post('*/attachments', async () => {
          await gate;
          return HttpResponse.json(pendingAttachment, { status: 201 });
        }),
        http.post('*/incidents', () => {
          requests++;
          return HttpResponse.json({ number: 'INC-1042' }, { status: 201 });
        }),
      );
      const user = userEvent.setup({ applyAccept: false });
      renderAtReport(<ReportIncidentForm applications={[checkoutApp, catalogApp]} />);
      await fillRequiredFields(user);
      await upload(user, png('slow.png'));
      await screen.findByText('Uploading…');

      await user.click(screen.getByRole('button', { name: 'Report incident' }));

      expect(await screen.findByText('Wait for the uploads to finish.')).toBeInTheDocument();
      expect(requests).toBe(0);
      release();

      await waitFor(() => expect(screen.queryByText('Wait for the uploads to finish.')).not.toBeInTheDocument());
    }, 20_000);
  });
});
