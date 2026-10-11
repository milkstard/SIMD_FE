import type { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/ErrorBoundary';
import {
  AdminRoute,
  DashboardRoute,
  IncidentDetailRoute,
  IncidentListRoute,
  ReportRoute,
} from './lazyRoutes';
import { RootLayout } from './RootLayout';

/** Route table shared by the browser router and tests. Each screen is its own chunk and error boundary. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <DashboardRoute />, errorElement: <ErrorBoundary /> },
      { path: 'incidents', element: <IncidentListRoute />, errorElement: <ErrorBoundary /> },
      {
        path: 'incidents/:number',
        element: <IncidentDetailRoute />,
        errorElement: <ErrorBoundary />,
      },
      { path: 'report', element: <ReportRoute />, errorElement: <ErrorBoundary /> },
      { path: 'admin/*', element: <AdminRoute />, errorElement: <ErrorBoundary /> },
      {
        // Unknown URLs render "Page not found" inside the shell (the root boundary is the last resort).
        path: '*',
        loader: () => {
          throw new Response('Not Found', { status: 404 });
        },
        errorElement: <ErrorBoundary />,
      },
    ],
  },
];
