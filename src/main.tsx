import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AuthGuard } from './app/AuthGuard';
import { AppProviders } from './app/providers';
import { SignalRProvider } from './realtime';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <AuthGuard>
        <SignalRProvider>
          <App />
        </SignalRProvider>
      </AuthGuard>
    </AppProviders>
  </StrictMode>,
);
