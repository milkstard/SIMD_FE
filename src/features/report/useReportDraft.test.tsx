import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http } from 'msw';
import { StrictMode, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { meKeys } from '@/api/keys';
import { catalogApp, checkoutApp, currentUser } from '@/test/msw/fixtures';
import { server } from '@/test/msw/server';
import { mockAuth } from '@/test/renderWithProviders';
import { DRAFT_MAX_AGE_MS, draftKey } from './reportDraftStorage';
import {
  REPORT_DEFAULTS,
  type ReportIncidentInput,
  type ReportIncidentValues,
} from './reportIncident.schema';
import { useReportDraft } from './useReportDraft';

const USER_ID = currentUser.id ?? '';
const KEY = draftKey(USER_ID);
const applications = [checkoutApp, catalogApp];

beforeEach(() => {
  mockAuth();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function setup(options: { userId?: string | null; strict?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const userId = options.userId === undefined ? USER_ID : options.userId;
  if (userId) client.setQueryData(meKeys.current(), { ...currentUser, id: userId });
  const wrapper = ({ children }: { children: ReactNode }) => {
    const tree = <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return options.strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
  const hook = renderHook(
    () => {
      const form = useForm<ReportIncidentInput, unknown, ReportIncidentValues>({
        defaultValues: REPORT_DEFAULTS,
      });
      const draft = useReportDraft({ control: form.control, reset: form.reset, applications });
      return { form, draft };
    },
    { wrapper },
  );
  return { ...hook, client };
}

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const seed = (values: unknown, userId = USER_ID, v = 1) =>
  window.localStorage.setItem(draftKey(userId), JSON.stringify({ v, values }));
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
// The envelope without its timestamp.
const saved = () => {
  const envelope = stored();
  return envelope && { v: envelope.v, values: envelope.values };
};

describe('useReportDraft', () => {
  it('saves the typed fields once typing pauses for 500 ms', async () => {
    const { result } = setup();

    act(() => result.current.form.setValue('title', 'Checkout is down'));
    await advance(300); // well inside the pause (fake time also drifts with real time)
    expect(window.localStorage.getItem(KEY)).toBeNull();
    await advance(300);

    expect(saved()).toEqual({ v: 1, values: { title: 'Checkout is down' } });
    expect(result.current.draft.hasDraft).toBe(true);
  });

  it('never saves attachment ids', async () => {
    const { result } = setup();

    act(() => {
      result.current.form.setValue('title', 'Checkout is down');
      result.current.form.setValue('attachmentIds', ['a91c0000-0000-4000-8000-000000000001']);
    });
    await advance(500);

    expect(window.localStorage.getItem(KEY)).not.toContain('a91c0000');
  });

  it('removes the draft once every field is empty again', async () => {
    const { result } = setup();
    act(() => result.current.form.setValue('title', 'Checkout is down'));
    await advance(500);
    expect(saved()).not.toBeNull();

    act(() => result.current.form.setValue('title', ''));
    await advance(500);

    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(result.current.draft.hasDraft).toBe(false);
  });

  it('restores a saved draft on mount, without attachments', async () => {
    seed({ applicationId: checkoutApp.id, environment: 'UAT', severity: 'High', title: 'Half writ' });
    const { result } = setup();
    await advance(0);

    expect(result.current.form.getValues()).toMatchObject({
      applicationId: checkoutApp.id,
      environment: 'UAT',
      severity: 'High',
      title: 'Half writ',
      attachmentIds: [],
    });
    expect(result.current.draft.restored).toBe(true);
    expect(result.current.draft.hasDraft).toBe(true);
  });

  it('keeps the restored draft in storage when nothing is edited', async () => {
    seed({ title: 'Half writ' });
    setup();
    await advance(1_000);

    expect(saved()).toEqual({ v: 1, values: { title: 'Half writ' } });
  });

  it('lets the notice be dismissed', async () => {
    seed({ title: 'Half writ' });
    const { result } = setup();
    await advance(0);

    act(() => result.current.draft.dismissRestored());

    expect(result.current.draft.restored).toBe(false);
    expect(result.current.draft.hasDraft).toBe(true);
  });

  it('keeps drafts per user', async () => {
    seed({ title: 'Ana draft' }, 'ana');
    const { result } = setup({ userId: 'ben' });
    await advance(0);

    expect(result.current.form.getValues('title')).toBe('');
    expect(result.current.draft.restored).toBe(false);
    expect(window.localStorage.getItem(draftKey('ana'))).not.toBeNull();

    act(() => result.current.form.setValue('title', 'Ben draft'));
    await advance(500);
    expect(window.localStorage.getItem(draftKey('ben'))).toContain('Ben draft');
    expect(window.localStorage.getItem(draftKey('ana'))).toContain('Ana draft');
  });

  it.each([
    ['corrupt JSON', () => window.localStorage.setItem(KEY, '{not json')],
    ['an unknown version', () => seed({ title: 'x' }, USER_ID, 99)],
    ['an unknown severity', () => seed({ severity: 'Catastrophic', title: 'x' })],
    ['a wrong field type', () => seed({ title: 42 })],
    ['an over-long title', () => seed({ title: 'a'.repeat(201) })],
    ['a non-object', () => seed('just a string')],
  ])('discards a draft with %s instead of crashing', async (_name, arrange) => {
    arrange();
    const { result } = setup();
    await advance(0);

    expect(result.current.draft.restored).toBe(false);
    expect(result.current.form.getValues('title')).toBe('');
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('drops an application that no longer exists, together with its environment', async () => {
    seed({ applicationId: 'gone', environment: 'UAT', title: 'Still here' });
    const { result } = setup();
    await advance(0);

    expect(result.current.form.getValues()).toMatchObject({ applicationId: '', title: 'Still here' });
    expect(result.current.form.getValues('environment')).toBeUndefined();
  });

  it('drops an environment the application no longer offers', async () => {
    seed({ applicationId: catalogApp.id, environment: 'Production', title: 'Still here' });
    const { result } = setup();
    await advance(0);

    expect(result.current.form.getValues('applicationId')).toBe(catalogApp.id);
    expect(result.current.form.getValues('environment')).toBeUndefined();
  });

  it('tolerates storage that throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const { result, unmount } = setup();
    await advance(0);

    act(() => result.current.form.setValue('title', 'Typing on'));
    await advance(500);

    expect(result.current.form.getValues('title')).toBe('Typing on');
    expect(result.current.draft.restored).toBe(false);
    act(() => result.current.draft.clear());
    expect(() => unmount()).not.toThrow();
  });

  it('reads and writes nothing until the user is known', async () => {
    server.use(http.get('*/me', () => new Promise<Response>(() => undefined)));
    seed({ title: 'Half writ' });
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = setup({ userId: null });

    act(() => result.current.form.setValue('title', 'Typing on'));
    await advance(1_000);

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(result.current.draft.restored).toBe(false);
  });

  it('restores and keeps the draft when the user becomes known after the form mounted', async () => {
    server.use(http.get('*/me', () => new Promise<Response>(() => undefined)));
    seed({ title: 'Half writ' });
    const { result, client } = setup({ userId: null });
    await advance(1_000);

    act(() => client.setQueryData(meKeys.current(), currentUser));
    await advance(1_000);

    expect(result.current.form.getValues('title')).toBe('Half writ');
    expect(result.current.draft.restored).toBe(true);
    expect(saved()).toEqual({ v: 1, values: { title: 'Half writ' } });
  });

  it('saves pending typing when the form goes away before the pause ends', async () => {
    const { result, unmount } = setup();
    await advance(0);

    act(() => result.current.form.setValue('title', 'Session is ending'));
    unmount();

    expect(saved()).toEqual({ v: 1, values: { title: 'Session is ending' } });
  });

  it('does not erase the draft when the form unmounts before anything was typed', () => {
    seed({ title: 'Half writ' });
    const { unmount } = setup();
    unmount();

    expect(saved()).toEqual({ v: 1, values: { title: 'Half writ' } });
  });

  it('clear() removes the draft and is not undone by a pending save or unmount', async () => {
    const { result, unmount } = setup();
    act(() => result.current.form.setValue('title', 'Reported soon'));
    await advance(500);
    act(() => result.current.form.setValue('title', 'Reported soon!'));

    act(() => result.current.draft.clear());
    await advance(500);
    unmount();

    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(result.current.draft.hasDraft).toBe(false);
  });

  it('removes the stored draft when every field is emptied and the form goes away within the pause', async () => {
    seed({ title: 'Half writ' });
    const { result, unmount } = setup();
    await advance(0);

    act(() => result.current.form.setValue('title', ''));
    unmount();

    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('does not overwrite what was typed before the user became known', async () => {
    server.use(http.get('*/me', () => new Promise<Response>(() => undefined)));
    seed({ title: 'Old draft' });
    const { result, client } = setup({ userId: null });

    act(() => result.current.form.setValue('title', 'Typed first'));
    act(() => client.setQueryData(meKeys.current(), currentUser));
    await advance(1_000);

    expect(result.current.form.getValues('title')).toBe('Typed first');
    expect(result.current.draft.restored).toBe(false);
    expect(saved()).toEqual({ v: 1, values: { title: 'Typed first' } });
  });

  it('restores once and keeps the draft under StrictMode double effects', async () => {
    seed({ title: 'Half writ' });
    const { result } = setup({ strict: true });
    await advance(1_000);

    expect(result.current.form.getValues('title')).toBe('Half writ');
    expect(result.current.draft.restored).toBe(true);
    expect(saved()).toEqual({ v: 1, values: { title: 'Half writ' } });
  });

  it('discards a draft older than 7 days', async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ v: 1, savedAt: Date.now() - DRAFT_MAX_AGE_MS - 1_000, values: { title: 'Stale' } }),
    );
    const { result } = setup();
    await advance(0);

    expect(result.current.draft.restored).toBe(false);
    expect(result.current.form.getValues('title')).toBe('');
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('stamps the time of the save', async () => {
    const { result } = setup();

    act(() => result.current.form.setValue('title', 'Checkout is down'));
    await advance(600);

    const savedAt = stored()?.savedAt as number;
    expect(Date.now() - savedAt).toBeLessThan(DRAFT_MAX_AGE_MS);
  });
});
