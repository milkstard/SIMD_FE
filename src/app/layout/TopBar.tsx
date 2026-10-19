import { useMsal } from '@azure/msal-react';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import { Box, Button, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useConnectionState } from '@/realtime';
import { ConnectionBanner } from '@/shared/ConnectionBanner';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { UserAvatar } from '@/shared/UserAvatar';

export function TopBar() {
  const { instance, accounts } = useMsal();
  // Loading /me here keeps it in the cache for the whole session (the expired-session note reads it).
  const { data: user } = useCurrentUser();
  const account = instance.getActiveAccount() ?? accounts[0];
  const connection = useConnectionState();

  return (
    <Box
      component="header"
      sx={{
        minHeight: 48,
        px: 4,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 3,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Button variant="contained" component={RouterLink} to="/report">
        Report incident
      </Button>
      <ConnectionBanner state={connection} compact live />
      <IconButton aria-label="Notifications" sx={{ width: 44, height: 44 }}>
        <NotificationsNoneOutlined />
      </IconButton>
      <UserAvatar name={user?.displayName ?? account?.name ?? account?.username} />
    </Box>
  );
}
