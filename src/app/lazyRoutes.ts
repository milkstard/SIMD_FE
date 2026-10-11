import { lazy } from 'react';

// One chunk per screen (route-level code splitting).
export const DashboardRoute = lazy(() => import('@/features/dashboard/DashboardRoute'));
export const IncidentListRoute = lazy(() => import('@/features/incidents/IncidentListRoute'));
export const IncidentDetailRoute = lazy(() => import('@/features/incidents/IncidentDetailRoute'));
export const ReportRoute = lazy(() => import('@/features/report/ReportRoute'));
export const AdminRoute = lazy(() => import('@/features/admin/AdminRoute'));
