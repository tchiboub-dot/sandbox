/**
 * API Configuration for Cloud Device Lab
 * 
 * Resolves API_BASE_URL in this order:
 * 1. VITE_API_URL environment variable (full base URL)
 * 2. VITE_API_BASE_URL environment variable (full base URL)
 * 3. Fallback to "/api" (for Vercel or same-origin deployment)
 */

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

export function isCustomBackend(): boolean {
  return API_BASE_URL !== '/api';
}

/**
 * Get deployment environment info for debug logging
 */
export function getDeploymentInfo() {
  return {
    environment: import.meta.env.PROD ? 'production' : 'development',
    apiBaseUrl: API_BASE_URL,
    apiHealthUrl: API_HEALTH_URL,
    customBackend: isCustomBackend(),
    hasViteApiUrl: Boolean(rawApiUrl),
    hasViteApiBaseUrl: Boolean(rawApiBaseUrl),
  };
}

if (isDevMode()) {
  console.info('[CloudDeviceLab] Deployment Config:', getDeploymentInfo());
}
