import '@testing-library/jest-dom/vitest';
import { useIncidentFilterStore } from '@/features/incidents/incidentFilterStore';

// Browser-mode tests run in real Chromium: no MSW node server, API calls are mocked per test file.
afterEach(() => {
  useIncidentFilterStore.setState({ filters: {}, activeViewId: null, resetKey: 0 });
});
