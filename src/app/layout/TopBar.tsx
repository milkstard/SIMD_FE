import { useMsal } from '@azure/msal-react';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import { Box, Button, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useConnectionState } from '@/realtime';
import { ConnectionBanner } from '@/shared/ConnectionBanner';
import { UserAvatar } from '@/shared/UserAvatar';

export function TopBar() {
  const { instance, accounts } = useMsal();
  // useCurrentUser() is blocked on BE-11 (D-01), so the name comes from the MSAL account for now.
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
      <UserAvatar name={account?.name ?? account?.username} />
    </Box>
  );
}
