const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

function normalizeBaseUrl(value: string): string {
  const trimmed = value.replace(/\/+$/, '');
  if (trimmed === '/api') {
    return '/api';
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = rawApiUrl
  ? normalizeBaseUrl(rawApiUrl)
  : rawApiBaseUrl
    ? normalizeBaseUrl(rawApiBaseUrl)
    : '/api';

export const API_HEALTH_URL =
  API_BASE_URL === '/api'
    ? '/health'
    : `${API_BASE_URL.replace(/\/api$/, '')}/health`;

export const API_TIMEOUT_MS = 20000;

export function isDevMode(): boolean {
  return Boolean(import.meta.env.DEV);
}

if (isDevMode()) {
  console.info('[CloudDeviceLab] API_BASE_URL:', API_BASE_URL);
  console.info('[CloudDeviceLab] API_HEALTH_URL:', API_HEALTH_URL);
}
