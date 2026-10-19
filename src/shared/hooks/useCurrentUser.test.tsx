import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { meKeys } from '@/api/keys';
import { currentUser } from '@/test/msw/fixtures';
import { mockAuth } from '@/test/renderWithProviders';
import { useCurrentUser } from './useCurrentUser';

beforeEach(mockAuth);
afterEach(() => vi.restoreAllMocks());

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useCurrentUser(), { wrapper }) };
}

describe('useCurrentUser', () => {
  it('resolves with the roles of the signed-in account', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.roles).toEqual(['Responder']);
    expect(result.current.data?.id).toBe(currentUser.id);
  });

  it('caches the user under meKeys.current()', async () => {
    const { result, client } = setup();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(meKeys.current())).toEqual(currentUser);
  });

  it('keeps the user for the whole session', async () => {
    const { result, client } = setup();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const query = client.getQueryCache().find({ queryKey: meKeys.current() });
    expect(query?.observers[0]?.options.staleTime).toBe(Infinity);
    expect(query?.options.gcTime).toBe(Infinity);
  });
});
