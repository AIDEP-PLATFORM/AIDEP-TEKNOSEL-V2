import { Platform } from 'react-native';

export const Colors = {
  // Arka planlar
  background: '#0a1628',
  backgroundGradient: ['#0a1628', '#0e2137', '#0a1e2e'] as string[],
  surface: 'rgba(14,33,55,0.7)',
  surfaceSolid: '#0e2137',
  sidebar: '#0a1628',

  // Primary — logo teal
  primary: '#06b6d4',
  primaryDark: '#0e7490',
  primaryLight: '#67e8f9',

  // Accent — logo orange (güvenli rota oku)
  accent: '#f97316',
  accentLight: '#fdba74',

  // Durum renkleri
  critical: '#ef4444',
  criticalLight: '#fca5a5',
  high: '#f97316',
  highLight: '#fdba74',
  medium: '#facc15',
  mediumLight: '#fde68a',
  success: '#22c55e',
  successLight: '#86efac',

  // Hasar seviyeleri
  damageNone: '#22c55e',
  damageLow: '#facc15',
  damageMedium: '#f97316',
  damageHigh: '#ef4444',
  damageCritical: '#7f1d1d',

  // Rota
  routeSafe: '#06b6d4',
  routeRisky: '#facc15',
  routeBlocked: '#ef4444',

  // Yazı
  text: '#f1f5f9',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.3)',

  // Kenarlık
  border: 'rgba(6,182,212,0.15)',
  borderLight: 'rgba(6,182,212,0.25)',

  white: '#ffffff',
  error: '#ef4444',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
