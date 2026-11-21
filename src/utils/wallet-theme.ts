import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export type ColorScheme = 'light' | 'dark';

export interface WalletPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryLight: string;
  primaryForeground: string;
  border: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  info: string;
  accent: string;
  tabIconDefault: string;
  tabIconSelected: string;
  tint: string;
  text: string;
  /** Gradient endpoints for primary CTA / balance card */
  gradientStart: string;
  gradientEnd: string;
  gradientErrorStart: string;
  gradientErrorEnd: string;
}

// Qirsh brand palette (see branding/README.md and the Qirsh design system).
// Nile green + coin gold on warm sand. Brand fills are flat: gradient start/end are equal on purpose.
export const walletPaletteLight: WalletPalette = {
  background: '#FAF6EC', // sand-50
  foreground: '#10201E', // ink-900
  card: '#FFFFFF',
  cardForeground: '#10201E',
  muted: '#EDE6D6', // sand-200
  mutedForeground: '#55655F', // ink-600
  primary: '#0B5F57', // nile-700
  primaryLight: '#13877B', // nile-500
  primaryForeground: '#FFFFFF',
  border: '#EDE6D6',
  success: '#18794E', // money in
  successLight: '#DDF1E5',
  error: '#C23B2A', // money out / errors
  errorLight: '#FBE3DF',
  warning: '#8A5A00', // gold-700 (readable as text)
  info: '#13877B',
  accent: '#F0B341', // coin gold (fill only)
  tabIconDefault: '#55655F',
  tabIconSelected: '#0B5F57',
  tint: '#0B5F57',
  text: '#10201E',
  gradientStart: '#0B5F57',
  gradientEnd: '#0B5F57',
  gradientErrorStart: '#C23B2A',
  gradientErrorEnd: '#C23B2A',
};

export const walletPaletteDark: WalletPalette = {
  background: '#0A1412', // night-950
  foreground: '#EAF2EF', // mist-100
  card: '#11201D', // night-900
  cardForeground: '#EAF2EF',
  muted: '#1B2E2A', // night-800
  mutedForeground: '#9EB3AD', // mist-400
  primary: '#7CC6BA', // nile-300 (use primaryForeground on it)
  primaryLight: '#13877B',
  primaryForeground: '#062E2A', // nile-900
  border: '#1B2E2A',
  success: '#5FD39A',
  successLight: '#12382A',
  error: '#FF8A78',
  errorLight: '#3D1A16',
  warning: '#F0B341',
  info: '#7CC6BA',
  accent: '#F0B341',
  tabIconDefault: '#9EB3AD',
  tabIconSelected: '#7CC6BA',
  tint: '#7CC6BA',
  text: '#EAF2EF',
  // The balance card and main buttons stay Nile in both themes (white text on them).
  gradientStart: '#0B5F57',
  gradientEnd: '#0B5F57',
  gradientErrorStart: '#C23B2A',
  gradientErrorEnd: '#C23B2A',
};

const THEME_STORAGE_KEY = '@qirsh/theme';

export { THEME_STORAGE_KEY };

export function getWalletPalette(scheme: ColorScheme): WalletPalette {
  return scheme === 'dark' ? walletPaletteDark : walletPaletteLight;
}

export function buildNavigationTheme(scheme: ColorScheme, palette: WalletPalette): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
      notification: palette.error,
    },
    fonts: {
      regular: { fontFamily: 'ReadexPro-Regular', fontWeight: 'normal' },
      medium: { fontFamily: 'ReadexPro-Medium', fontWeight: 'normal' },
      bold: { fontFamily: 'ReadexPro-SemiBold', fontWeight: 'normal' },
      heavy: { fontFamily: 'ReadexPro-Bold', fontWeight: 'normal' },
    },
  };
}
