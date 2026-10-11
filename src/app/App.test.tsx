import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { theme } from './theme';

describe('App', () => {
  it('renders the Monitor screen at /', async () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Monitor' })).toBeInTheDocument();
  });
});
