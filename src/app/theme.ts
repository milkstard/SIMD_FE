import { createTheme } from '@mui/material/styles';
import type { CSSProperties } from 'react';

// Design tokens from the IncidentHub design system (tokens.json v3).
// This is the only file allowed to hold raw colour values.

interface IncidentHubPalette {
  surface200: string;
  lineStrong: string;
  brandTint: string;
  nav: { ground: string; ink: string; inkMuted: string };
  focus: string;
  focusOnNav: string;
  spark: string;
  sevCriticalTint: string;
  sevHighTint: string;
  statusOperationalTint: string;
}

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Palette extends IncidentHubPalette {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface PaletteOptions extends Partial<IncidentHubPalette> {}

  interface TypographyVariants {
    displayKpi: CSSProperties;
    titlePage: CSSProperties;
    heading: CSSProperties;
    monoId: CSSProperties;
  }
  interface TypographyVariantsOptions {
    displayKpi?: CSSProperties;
    titlePage?: CSSProperties;
    heading?: CSSProperties;
    monoId?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    displayKpi: true;
    titlePage: true;
    heading: true;
    monoId: true;
  }
}

const fontSans = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
const fontDisplay = '"Space Grotesk", "IBM Plex Sans", system-ui, sans-serif';
const fontMono = '"IBM Plex Mono", Consolas, ui-monospace, monospace';

const light = {
  surface000: '#ffffff',
  surface100: '#f5f6fc',
  surface200: '#e8eaf6',
  line: '#d6d9ec',
  lineStrong: '#7c80a8',
  ink: '#17183a',
  inkMuted: '#535679',
  brand: '#3b3fd6',
  brandStrong: '#2a2ca8',
  brandTint: '#e3e5ff',
  onBrand: '#ffffff',
  navGround: '#1d1b55',
  focus: '#3b3fd6',
  sevCritical: '#c81e3a',
  sevCriticalTint: '#ffe6ea',
  sevHigh: '#b34700',
  sevHighTint: '#ffedd8',
  statusOperational: '#0b7a50',
  statusOperationalTint: '#d8f6e8',
};

const dark: typeof light = {
  surface000: '#1c1c3a',
  surface100: '#13132a',
  surface200: '#0d0d20',
  line: '#2e2f55',
  lineStrong: '#6f73a8',
  ink: '#ecebff',
  inkMuted: '#a7a8cf',
  brand: '#8c95ff',
  brandStrong: '#aab1ff',
  brandTint: '#2a2d6e',
  onBrand: '#10113a',
  navGround: '#28266a',
  focus: '#aab1ff',
  sevCritical: '#ff8a9a',
  sevCriticalTint: '#3e1824',
  sevHigh: '#ffa95e',
  sevHighTint: '#3c2412',
  statusOperational: '#5fe0a8',
  statusOperationalTint: '#123326',
};

const shared = { navInk: '#eceaff', navInkMuted: '#a9a7e0', spark: '#c6f24e' };

const palette = (t: typeof light) => ({
  primary: { main: t.brand, dark: t.brandStrong, contrastText: t.onBrand },
  error: { main: t.sevCritical },
  warning: { main: t.sevHigh },
  success: { main: t.statusOperational },
  background: { default: t.surface100, paper: t.surface000 },
  text: { primary: t.ink, secondary: t.inkMuted },
  divider: t.line,
  surface200: t.surface200,
  lineStrong: t.lineStrong,
  brandTint: t.brandTint,
  nav: { ground: t.navGround, ink: shared.navInk, inkMuted: shared.navInkMuted },
  focus: t.focus,
  focusOnNav: shared.spark,
  spark: shared.spark,
  sevCriticalTint: t.sevCriticalTint,
  sevHighTint: t.sevHighTint,
  statusOperationalTint: t.statusOperationalTint,
});

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: '[data-theme="%s"]' },
  colorSchemes: {
    light: { palette: palette(light) },
    dark: { palette: palette(dark) },
  },
  spacing: 4, // 4px grid: spacing(4) = space-4 = 16px
  shape: { borderRadius: 6 }, // radius-md
  typography: {
    fontFamily: fontSans,
    fontSize: 14,
    body1: { fontSize: 14, lineHeight: '20px' },
    body2: { fontSize: 13, lineHeight: '18px' },
    button: { fontWeight: 600, textTransform: 'none' },
    displayKpi: {
      fontFamily: fontDisplay,
      fontSize: 40,
      lineHeight: '44px',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    titlePage: { fontFamily: fontDisplay, fontSize: 24, lineHeight: '32px', fontWeight: 600 },
    heading: { fontFamily: fontSans, fontSize: 18, lineHeight: '26px', fontWeight: 600 },
    caption: { fontFamily: fontSans, fontSize: 12, lineHeight: '16px', fontWeight: 400 },
    monoId: { fontFamily: fontMono, fontSize: 13, lineHeight: '20px', fontWeight: 500 },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: { displayKpi: 'p', titlePage: 'h1', heading: 'h2', monoId: 'span' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 36, borderRadius: 6 },
        sizeLarge: { minHeight: 44, fontSize: 15 },
      },
    },
    MuiCssBaseline: {
      styleOverrides: (t) => ({
        ':focus-visible': {
          outline: `2px solid ${t.vars?.palette.focus ?? t.palette.focus}`,
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
          },
        },
      }),
    },
  },
});
