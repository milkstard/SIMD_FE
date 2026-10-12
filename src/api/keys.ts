export const meKeys = {
  all: ['me'] as const,
  current: () => [...meKeys.all, 'current'] as const,
};

export const incidentKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...incidentKeys.lists(), filters] as const,
  details: () => [...incidentKeys.all, 'detail'] as const,
  detail: (number: string) => [...incidentKeys.details(), number] as const,
  comments: (incidentId: string) => [...incidentKeys.all, 'comments', incidentId] as const,
  history: (incidentId: string) => [...incidentKeys.all, 'history', incidentId] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summaries: () => [...dashboardKeys.all, 'summary'] as const,
  summary: (range: string) => [...dashboardKeys.summaries(), range] as const,
  appStatus: () => [...dashboardKeys.all, 'app-status'] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: { unreadOnly: boolean }) => [...notificationKeys.lists(), filters] as const,
};
