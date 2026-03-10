/**
 * Environment Verification Hook
 * 
 * Checks and logs environment configuration in development mode
 * Helps identify environment variable issues on Vercel
 */

import { useEffect } from 'react';

interface EnvironmentCheck {
  apiBaseUrl: string;
  isDev: boolean;
  isProd: boolean;
  hasCustomBackend: boolean;
  environment: string;
  timestamp: string;
}

export function useEnvironmentCheck(): EnvironmentCheck {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  const hasCustomBackend = apiBaseUrl !== '/api';

  const config: EnvironmentCheck = {
    apiBaseUrl,
    isDev,
    isProd,
    hasCustomBackend,
    environment: isProd ? 'production' : 'development',
    timestamp: new Date().toISOString(),
  };

  useEffect(() => {
    if (isDev) {
      console.group('[EnvironmentCheck] Configuration');
      console.log('Environment:', config.environment);
      console.log('API Base URL:', config.apiBaseUrl);
      console.log('Custom Backend:', config.hasCustomBackend);
      console.log('Development Mode:', config.isDev);
      console.log('Production Mode:', config.isProd);
      console.log('Timestamp:', config.timestamp);
      console.groupEnd();
    }
  }, [isDev]);

  return config;
}

/**
 * Component to display environment information
 * Only visible in development mode
 */
export function EnvironmentDebugger() {
  const config = useEnvironmentCheck();

  if (!config.isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs">
      <button
        onClick={() => {
          const element = document.getElementById('env-debugger-details');
          if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
          }
        }}
        className="px-3 py-2 bg-yellow-900/80 hover:bg-yellow-800 text-yellow-100 rounded text-xs font-mono border border-yellow-700/50 cursor-pointer"
      >
        🔧 Env Debug
      </button>
      <div
        id="env-debugger-details"
        className="mt-2 p-3 bg-slate-900/90 text-xs text-slate-300 rounded border border-slate-700/50 font-mono hidden max-h-60 overflow-auto"
      >
        <div className="space-y-1">
          <div>
            <span className="text-slate-400">Environment:</span> {config.environment}
          </div>
          <div>
            <span className="text-slate-400">API URL:</span> {config.apiBaseUrl}
          </div>
          <div>
            <span className="text-slate-400">Custom Backend:</span> {config.hasCustomBackend ? '✓' : '✗'}
          </div>
          <div>
            <span className="text-slate-400">Dev Mode:</span> {config.isDev ? '✓' : '✗'}
          </div>
          <div>
            <span className="text-slate-400">Prod Mode:</span> {config.isProd ? '✓' : '✗'}
          </div>
          <hr className="border-slate-700 my-1" />
          <div className="text-slate-400">
            <div>
              <strong>Env Variables:</strong>
            </div>
            <pre className="text-xs mt-1 text-slate-300 whitespace-pre-wrap break-words">
{`VITE_API_URL=${import.meta.env.VITE_API_URL || '(not set)'}
VITE_API_BASE_URL=${import.meta.env.VITE_API_BASE_URL || '(not set)'}
DEV=${config.isDev}
PROD=${config.isProd}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
