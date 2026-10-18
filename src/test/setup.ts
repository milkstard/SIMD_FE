import '@testing-library/jest-dom/vitest';
import { useToastStore } from '@/shared/toast/toastStore';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  useToastStore.getState().close();
});
afterAll(() => server.close());
