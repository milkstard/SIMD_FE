import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { theme } from '@/app/theme';
import { UserAvatar } from './UserAvatar';

function renderAvatar(name?: string | null) {
  return render(
    <ThemeProvider theme={theme}>
      <UserAvatar name={name} />
    </ThemeProvider>,
  );
}

describe('UserAvatar', () => {
  it('shows initials and uses the full name as its accessible name', () => {
    renderAvatar('Ana Reyes');
    expect(screen.getByRole('img', { name: 'Ana Reyes' })).toHaveTextContent('AR');
  });

  it('takes initials from the local part of an email', () => {
    renderAvatar('ana.reyes@corp.example');
    expect(screen.getByRole('img', { name: 'ana.reyes@corp.example' })).toHaveTextContent('AR');
  });

  it('uses one letter for a single-word name', () => {
    renderAvatar('Madonna');
    expect(screen.getByRole('img', { name: 'Madonna' })).toHaveTextContent('M');
  });

  it('falls back to a labelled person icon without a name', () => {
    renderAvatar(null);
    expect(screen.getByRole('img', { name: 'Signed-in user' })).toBeInTheDocument();
  });
});
