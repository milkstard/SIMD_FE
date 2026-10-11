export const meKeys = {
  all: ['me'] as const,
  current: () => [...meKeys.all, 'current'] as const,
};
