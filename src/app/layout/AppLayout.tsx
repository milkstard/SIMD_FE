import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { useConnectionState } from '@/realtime/connectionStore';
import { ConnectionBanner } from '@/shared/ConnectionBanner';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';

/** App shell: nav rail, top bar, connection strip (only when not Live) and the content area. */
export function AppLayout({ children }: { children: ReactNode }) {
  const connection = useConnectionState();

  return (
    <Box
      sx={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', bgcolor: 'background.default' }}
    >
      <NavRail />
      <Box sx={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        {connection !== 'live' && <ConnectionBanner state={connection} />}
        <Box component="main" sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
