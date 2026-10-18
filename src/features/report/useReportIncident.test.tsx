import { delay, http, HttpResponse } from 'msw';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw/server';
import { catalogApp, checkoutApp, createdIncident } from '@/test/msw/fixtures';
import { mockAuth, renderAtReport } from '@/test/renderWithProviders';
import { ReportIncidentForm } from './ReportIncidentForm';

// Each test fills the whole form through the UI, which is slow on a cold run.
vi.setConfig({ testTimeout: 20_000 });

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

type User = ReturnType<typeof userEvent.setup>;

async function fillValidReport(user: User) {
  await user.click(screen.getByRole('combobox', { name: /^application/i }));
  await user.click(await screen.findByRole('option', { name: /checkout/i }));
  await user.click(screen.getByRole('combobox', { name: /^environment/i }));
  await user.click(await screen.findByRole('option', { name: 'Production' }));
  await user.click(screen.getByRole('radio', { name: /^high/i }));
  await user.type(screen.getByRole('textbox', { name: /^title/i }), 'Checkout fails with 500');
  await user.type(screen.getByRole('textbox', { name: /^description/i }), 'Users see an error page.');
}

function setup() {
  renderAtReport(<ReportIncidentForm applications={[checkoutApp, catalogApp]} />);
  return userEvent.setup();
}

/** Records the Idempotency-Key of every POST and answers with the given responses in order. */
function respondWith(...responses: (() => Response)[]) {
  const keys: (string | null)[] = [];
  const bodies: unknown[] = [];
  server.use(
    http.post('*/incidents', async ({ request }) => {
      keys.push(request.headers.get('Idempotency-Key'));
      bodies.push(await request.json());
      await delay(30);
      return responses[Math.min(keys.length - 1, responses.length - 1)]();
    }),
  );
  return { keys, bodies };
}

const created = () => HttpResponse.json(createdIncident, { status: 201 });
const problem = (status: number, body: object) => () =>
  HttpResponse.json(body, { status, headers: { 'Content-Type': 'application/problem+json' } });

describe('submitting a report', () => {
  it('sends the report with an Idempotency-Key and navigates to the new incident on 201', async () => {
    const { keys, bodies } = respondWith(created);
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('Incident page INC-1042')).toBeInTheDocument();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(bodies[0]).toEqual({
      applicationId: checkoutApp.id,
      environment: 'Production',
      severity: 'High',
      title: 'Checkout fails with 500',
      description: 'Users see an error page.',
      stepsToReproduce: null,
      attachmentIds: [],
    });
  });

  it('sends one request with one key on a double-click', async () => {
    const { keys } = respondWith(created);
    const user = setup();
    await fillValidReport(user);

    await user.dblClick(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('Incident page INC-1042')).toBeInTheDocument();
    expect(keys).toHaveLength(1);
  });

  it('reuses the key for an unedited resubmit and issues a new one after an edit', async () => {
    const { keys } = respondWith(
      problem(500, { title: 'Unexpected error', status: 500 }),
      problem(500, { title: 'Unexpected error', status: 500 }),
      created,
    );
    const user = setup();
    await fillValidReport(user);
    const submit = screen.getByRole('button', { name: 'Report incident' });

    await user.click(submit);
    await screen.findByRole('alert');
    await user.click(submit);
    await vi.waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).toBe(keys[0]);

    await user.type(screen.getByRole('textbox', { name: /^title/i }), '!');
    await user.click(submit);

    await screen.findByText('Incident page INC-1042');
    expect(keys).toHaveLength(3);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('shows a 422 on the matching field and unmapped keys in a form-level alert', async () => {
    respondWith(
      problem(422, {
        title: 'Validation failed',
        status: 422,
        errors: { title: ['Title already used.'], applicationId: ['Not your team.'], other: ['Odd.'] },
      }),
    );
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    // Wait for the response to land: the title field exists from the start.
    expect(await screen.findByText('Title already used.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^title/i })).toBeInvalid();
    expect(screen.getByText('Not your team.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Odd.');
  });

  it('shows only a form-level alert when a 422 has no field errors', async () => {
    respondWith(problem(422, { title: 'Validation failed', status: 422, errors: null }));
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Check the form and try again.');
  });

  it('survives a malformed 422 errors object', async () => {
    respondWith(problem(422, { title: 'Validation failed', status: 422, errors: { title: 'oops', x: 5 } }));
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('oops')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('5');
  });

  it('sends one request when submit fires twice synchronously', async () => {
    const { keys } = respondWith(created);
    const user = setup();
    await fillValidReport(user);
    const form = screen.getByRole('form', { name: /report an incident/i });

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(await screen.findByText('Incident page INC-1042')).toBeInTheDocument();
    expect(keys).toHaveLength(1);
  });

  it('does not build a route from a malformed incident number', async () => {
    respondWith(() => HttpResponse.json({ ...createdIncident, number: 'INC-1/../admin' }, { status: 201 }));
    server.use(http.get('*/incidents', () => HttpResponse.json({ items: [] })));
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('Incident reported. Find it in the incident list.')).toBeInTheDocument();
    expect(screen.queryByText(/Incident page/)).not.toBeInTheDocument();
  });

  it.each([
    [403, 'You cannot report incidents for this application.'],
    [429, 'Too many requests. Wait a moment and try again.'],
    [409, 'The incident could not be reported. Try again.'],
    [502, 'The incident could not be reported. Try again.'],
  ])('shows fixed copy, not server text, for a %i', async (status, message) => {
    respondWith(problem(status, { title: 'Internal host db-01 exploded', status }));
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText(/db-01/)).not.toBeInTheDocument();
  });

  it('shows a toast when the request fails without a response', async () => {
    server.use(http.post('*/incidents', () => HttpResponse.error()));
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('The incident could not be reported. Try again.')).toBeInTheDocument();
  });

  it('links a 409 duplicate to the existing incident', async () => {
    respondWith(
      problem(409, { title: 'Duplicate incident', status: 409, existingIncidentNumber: 'INC-1001' }),
    );
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    const link = await screen.findByRole('link', { name: 'INC-1001' });
    expect(link).toHaveAttribute('href', '/incidents/INC-1001');
  });

  it('shows a toast with the trace ID on a 500', async () => {
    respondWith(problem(500, { title: 'Unexpected error', status: 500, traceId: '00-4bf92f35-01' }));
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText(/00-4bf92f35-01/)).toBeInTheDocument();
  });

  it('shows a toast on a 413', async () => {
    respondWith(problem(413, { title: 'Payload too large', status: 413 }));
    const user = setup();
    await fillValidReport(user);

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('The report is too large to send.')).toBeInTheDocument();
  });
});

describe('duplicate hints', () => {
  it('still submits the report while the hints request fails', async () => {
    server.use(http.get('*/incidents/similar', () => new HttpResponse(null, { status: 500 })));
    respondWith(created);
    const user = setup();
    await fillValidReport(user);
    expect(await screen.findByText("Couldn't check for similar incidents.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Report incident' }));

    expect(await screen.findByText('Incident page INC-1042')).toBeInTheDocument();
  });
});
