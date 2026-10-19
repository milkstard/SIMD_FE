import '@testing-library/jest-dom/vitest';
import { useToastStore } from '@/shared/toast/toastStore';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  useToastStore.getState().close();
  // Report drafts must not leak between tests (some test files run in the node environment).
  if (typeof window !== 'undefined') window.localStorage.clear();
});
afterAll(() => server.close());
