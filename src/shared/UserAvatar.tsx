import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import { Avatar, Tooltip } from '@mui/material';

interface UserAvatarProps {
  name?: string | null;
}

/** Up to two letters: first and last word of a name, or of an email's local part. */
function initials(name: string): string {
  const base = name.includes('@') ? (name.split('@')[0] ?? '') : name;
  const words = base.split(/[\s._-]+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

const avatarSx = {
  width: 32,
  height: 32,
  fontSize: 13,
  fontWeight: 600,
  bgcolor: 'brandTint',
  color: 'text.primary',
} as const;

export function UserAvatar({ name }: UserAvatarProps) {
  if (!name) {
    return (
      <Avatar role="img" aria-label="Signed-in user" sx={avatarSx}>
        <PersonOutlineOutlined fontSize="small" />
      </Avatar>
    );
  }
  return (
    <Tooltip title={name}>
      <Avatar role="img" aria-label={name} sx={avatarSx}>
        {initials(name)}
      </Avatar>
    </Tooltip>
  );
}
