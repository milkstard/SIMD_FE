import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useForm, useWatch } from 'react-hook-form';
import { server } from '@/test/msw/server';
import { pendingAttachment } from '@/test/msw/fixtures';
import { mockAuth, renderAtReport } from '@/test/renderWithProviders';
import { AttachmentDropzone } from './AttachmentDropzone';
import type { ReportIncidentInput, ReportIncidentValues } from './reportIncident.schema';

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

function Host({ onPendingChange = () => {} }: { onPendingChange?: (pending: boolean) => void }) {
  const { control } = useForm<ReportIncidentInput, unknown, ReportIncidentValues>({
    defaultValues: { attachmentIds: [] },
  });
  return (
    <>
      <AttachmentDropzone control={control} onPendingChange={onPendingChange} />
      <p data-testid="ids">{JSON.stringify(useWatch({ control, name: 'attachmentIds' }))}</p>
    </>
  );
}

function setup(props?: Parameters<typeof Host>[0]) {
  renderAtReport(<Host {...props} />);
  return userEvent.setup({ applyAccept: false });
}

const png = (name = 'screenshot.png') => new File(['x'], name, { type: 'image/png' });
const ids = () => screen.getByTestId('ids').textContent;
const input = () => screen.getByLabelText('Attachment files');

function countUploads() {
  const counter = { count: 0 };
  server.use(
    http.post('*/attachments', () => {
      counter.count++;
      return HttpResponse.json(pendingAttachment, { status: 201 });
    }),
  );
  return counter;
}

describe('AttachmentDropzone', () => {
  it('rejects a disallowed file by name and reason without any request', async () => {
    const uploads = countUploads();
    const user = setup();

    await user.upload(input(), new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('logo.svg: SVG files are not allowed.');
    expect(uploads.count).toBe(0);
    expect(ids()).toBe('[]');
  });

  it('rejects an oversized file without any request', async () => {
    const uploads = countUploads();
    const user = setup();
    const big = png('big.png');
    Object.defineProperty(big, 'size', { value: 26 * 1024 * 1024 });

    await user.upload(input(), big);

    expect(await screen.findByRole('alert')).toHaveTextContent('big.png: The file is larger than 25 MB.');
    expect(uploads.count).toBe(0);
  });

  it('uploads a valid file, shows Pending and adds its id', async () => {
    const user = setup();

    await user.upload(input(), png());

    expect(await screen.findByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('screenshot.png')).toBeInTheDocument();
    expect(ids()).toBe(JSON.stringify([pendingAttachment.id]));
  });

  it('shows Infected, flags it and keeps its id out of the form', async () => {
    server.use(
      http.post('*/attachments', () =>
        HttpResponse.json({ ...pendingAttachment, scanStatus: 'Infected' }, { status: 201 }),
      ),
    );
    const user = setup();

    await user.upload(input(), png());

    expect(await screen.findByText('Infected')).toBeInTheDocument();
    expect(screen.getByText('This file is infected and will not be attached.')).toBeInTheDocument();
    expect(ids()).toBe('[]');
  });

  it('drops the id when the file is removed', async () => {
    const user = setup();
    await user.upload(input(), png());
    await screen.findByText('Pending');

    await user.click(screen.getByRole('button', { name: 'Remove screenshot.png' }));

    expect(screen.queryByText('screenshot.png')).not.toBeInTheDocument();
    expect(ids()).toBe('[]');
  });

  it('accepts files dropped on the zone', async () => {
    setup();

    fireEvent.drop(screen.getByText(/drag files here/i).parentElement as HTMLElement, {
      dataTransfer: { files: [png('dropped.png')] },
    });

    expect(await screen.findByText('dropped.png')).toBeInTheDocument();
    await waitFor(() => expect(ids()).toBe(JSON.stringify([pendingAttachment.id])));
  });

  it('uploads at most ten files and names the rest', async () => {
    const uploads = countUploads();
    const user = setup();

    await user.upload(
      input(),
      Array.from({ length: 11 }, (_, i) => png(`f${i}.png`)),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('f10.png: At most 10 files per report.');
    await waitFor(() => expect(uploads.count).toBe(10));
  });

  it.each([
    [413, {}, 'The file is larger than 25 MB.'],
    [422, { errors: { file: ['Content does not match the extension.'] } }, 'Content does not match the extension.'],
  ])('shows a per-file error for %i without a retry', async (status, body, message) => {
    server.use(
      http.post('*/attachments', () =>
        HttpResponse.json(body, { status, headers: { 'Content-Type': 'application/problem+json' } }),
      ),
    );
    const user = setup();

    await user.upload(input(), png());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(ids()).toBe('[]');
  });

  it('offers a retry after another error', async () => {
    let calls = 0;
    server.use(
      http.post('*/attachments', () => {
        calls++;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(pendingAttachment, { status: 201 });
      }),
    );
    const user = setup();
    await user.upload(input(), png());
    expect(await screen.findByText('Upload failed.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Pending')).toBeInTheDocument();
    expect(ids()).toBe(JSON.stringify([pendingAttachment.id]));
  });

  it('reports pending while an upload is in flight', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post('*/attachments', async () => {
        await gate;
        return HttpResponse.json(pendingAttachment, { status: 201 });
      }),
    );
    const onPendingChange = vi.fn();
    const user = setup({ onPendingChange });

    await user.upload(input(), png());
    await waitFor(() => expect(onPendingChange).toHaveBeenLastCalledWith(true));
    expect(screen.getByText('Uploading…')).toBeInTheDocument();

    release();

    await waitFor(() => expect(onPendingChange).toHaveBeenLastCalledWith(false));
  });

  it('opens the file chooser from a keyboard-reachable button', async () => {
    const user = setup();
    const click = vi.spyOn(input() as HTMLInputElement, 'click');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Choose files' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(click).toHaveBeenCalled();
  });
});
