export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8000/api/v1';

export const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://10.0.2.2:8000/ws';

export const APP_ENV =
  (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'production') ?? 'development';

export const IS_DEV = APP_ENV === 'development';

export const APP_NAME = 'AIDEP';

export const STORAGE_KEYS = {
  USER: 'user',
  TOKENS: 'tokens',
  OFFLINE_REPORTS: 'offline_reports',
} as const;
