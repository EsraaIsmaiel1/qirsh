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

export const walletPaletteLight: WalletPalette = {
  background: '#f8f9fc',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  muted: '#ececf0',
  mutedForeground: '#717182',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryForeground: '#ffffff',
  border: 'rgba(0,0,0,0.08)',
  success: '#10b981',
  successLight: '#d1fae5',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  info: '#3b82f6',
  accent: '#e9ebef',
  tabIconDefault: '#717182',
  tabIconSelected: '#6366f1',
  tint: '#6366f1',
  text: '#111827',
  gradientStart: '#818cf8',
  gradientEnd: '#6366f1',
  gradientErrorStart: '#f87171',
  gradientErrorEnd: '#ef4444',
};

export const walletPaletteDark: WalletPalette = {
  background: '#0f0f1a',
  foreground: '#f3f4f6',
  card: '#1a1a2e',
  cardForeground: '#f3f4f6',
  muted: '#2a2a40',
  mutedForeground: '#9ca3af',
  primary: '#818cf8',
  primaryLight: '#6366f1',
  primaryForeground: '#ffffff',
  border: 'rgba(255,255,255,0.08)',
  success: '#10b981',
  successLight: '#064e3b',
  error: '#ef4444',
  errorLight: '#7f1d1d',
  warning: '#f59e0b',
  info: '#3b82f6',
  accent: '#2a2a40',
  tabIconDefault: '#9ca3af',
  tabIconSelected: '#818cf8',
  tint: '#818cf8',
  text: '#f3f4f6',
  gradientStart: '#818cf8',
  gradientEnd: '#6366f1',
  gradientErrorStart: '#f87171',
  gradientErrorEnd: '#dc2626',
};

const THEME_STORAGE_KEY = '@paywallet/theme';

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
  };
}
