/**
 * Backend Unavailable Banner Component
 * Shows when the backend API is not reachable or misconfigured
 */

import { Server, ExternalLink, AlertCircle } from 'lucide-react';

interface BackendUnavailableBannerProps {
  status: 'offline' | 'misconfigured';
  apiUrl: string;
}

export default function BackendUnavailableBanner({ status, apiUrl }: BackendUnavailableBannerProps) {
  const isProduction = import.meta.env.PROD;
  
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/40 to-slate-900/40 p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-orange-500/10 p-3">
            <Server className="h-8 w-8 text-orange-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-orange-100 mb-2">
              Backend Service Unavailable
            </h2>
            <p className="text-orange-200/80 mb-6">
              {status === 'misconfigured'
                ? 'The backend API URL is not configured. Please set the required environment variables.'
                : 'Unable to connect to the backend API server. The service may be starting up or temporarily unavailable.'}
            </p>

            {isProduction && (
              <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-200 mb-2">Production Setup Required</h3>
                    <p className="text-slate-300 text-sm mb-3">
                      This frontend is deployed on Vercel, but the backend API needs to be deployed separately. 
                      Follow these steps to complete the setup:
                    </p>
                  </div>
                </div>

                <ol className="space-y-3 text-sm text-slate-300 ml-8">
                  <li className="pl-2">
                    <span className="font-semibold text-blue-200">Step 1:</span> Deploy the backend API to Railway, Heroku, or Azure
                  </li>
                  <li className="pl-2">
                    <span className="font-semibold text-blue-200">Step 2:</span> Get your backend API URL (e.g., <code className="text-emerald-400">https://your-api.railway.app</code>)
                  </li>
                  <li className="pl-2">
                    <span className="font-semibold text-blue-200">Step 3:</span> In Vercel Dashboard → Settings → Environment Variables, add:
                    <div className="mt-2 rounded-lg bg-slate-950/60 p-3 font-mono text-xs border border-slate-700/50">
                      <div className="text-emerald-400">VITE_API_URL</div>
                      <div className="text-slate-400 mt-1">=</div>
                      <div className="text-blue-300 mt-1">https://your-backend-url.com/api</div>
                    </div>
                  </li>
                  <li className="pl-2">
                    <span className="font-semibold text-blue-200">Step 4:</span> Redeploy your Vercel app to apply the environment variables
                  </li>
                </ol>

                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Current API URL:</strong>{' '}
                    <code className="text-orange-400">{apiUrl || '(not set)'}</code>
                  </p>
                </div>
              </div>
            )}

            {!isProduction && (
              <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6 mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-200 mb-2">Local Development Setup</h3>
                    <p className="text-slate-300 text-sm mb-3">
                      The backend server is not running. Start it with these steps:
                    </p>
                  </div>
                </div>

                <ol className="space-y-2 text-sm text-slate-300 ml-8">
                  <li className="pl-2">Open a new terminal in your project root</li>
                  <li className="pl-2">
                    Run: <code className="bg-slate-950/60 px-2 py-0.5 rounded text-emerald-400">npm --workspace backend/api-server run dev</code>
                  </li>
                  <li className="pl-2">Wait for "Server running on port 5000" message</li>
                  <li className="pl-2">Refresh this page</li>
                </ol>

                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Expected API URL:</strong>{' '}
                    <code className="text-blue-400">http://localhost:5000/api</code>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    <strong className="text-slate-300">Attempting:</strong>{' '}
                    <code className="text-orange-400">{apiUrl || '(not set)'}</code>
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Retry Connection
              </button>
              <a
                href="https://github.com/tchiboub-dot/sandbox#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-200 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
               Setup Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
