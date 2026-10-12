// Public real-time API. Everything else in realtime/ (connection, handlers, invoke helpers) is internal.
export { SignalRProvider } from './SignalRProvider';
export { useConnectionState, type ConnectionState } from './connectionStore';
export { useDashboardSubscription } from './useDashboardSubscription';
export { useWatchIncident } from './useWatchIncident';
