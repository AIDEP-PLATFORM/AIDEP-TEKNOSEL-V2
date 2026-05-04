import { Platform } from 'react-native';

export const Colors = {
  // Marka renkleri
  primary: '#E63946',     // Acil kırmızı - AIDEP ana rengi
  primaryLight: '#FF6B6B',
  secondary: '#1D3557',   // Koyu lacivert
  accent: '#457B9D',      // Mavi

  // Durum renkleri
  success: '#2A9D8F',
  warning: '#E9C46A',
  error: '#E63946',

  // Hasar seviyeleri
  damageNone: '#2A9D8F',
  damageLow: '#E9C46A',
  damageMedium: '#F4A261',
  damageHigh: '#E76F51',
  damageCritical: '#E63946',

  // Rota güvenlik renkleri
  routeSafe: '#2A9D8F',
  routeRisky: '#E9C46A',
  routeBlocked: '#E63946',

  // UI renkleri
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: '#DEE2E6',
  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  white: '#FFFFFF',
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
