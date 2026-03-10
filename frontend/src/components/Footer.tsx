import { Copyright, Github, LifeBuoy, BookOpenText, Code2, Activity, Info } from 'lucide-react';
import { BUILD_METADATA } from '../constants/buildMetadata';

export default function Footer() {
  const isDev = import.meta.env.DEV;
  
  return (
    <footer className="mt-16 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Cloud Device Lab</h3>
            <p className="text-slate-300 max-w-xl">
              A premium cloud testing platform to launch Android and Windows devices instantly for secure,
              isolated, and high-fidelity browser and application testing.
            </p>
            {isDev && (
              <div className="mt-4 p-2 bg-slate-900/50 rounded text-xs text-slate-400 border border-slate-700/50">
                <div className="flex items-center gap-1 mb-1">
                  <Info className="w-3 h-3" />
                  <span className="font-semibold">Debug Info (Dev Only)</span>
                </div>
                <div className="space-y-0.5">
                  <div>Version: <span className="text-slate-300">{BUILD_METADATA.version}</span></div>
                  <div>Commit: <span className="text-slate-300">{BUILD_METADATA.commitHash}</span></div>
                  <div>Built: <span className="text-slate-300">{BUILD_METADATA.buildTime}</span></div>
                  <div>Environment: <span className="text-slate-300">{BUILD_METADATA.environment}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <a href="https://github.com/tchiboub-dot/sandbox/blob/main/README.md" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-primary-300 transition-colors inline-flex items-center gap-2">
              <BookOpenText className="w-4 h-4" /> Documentation
            </a>
            <a href="https://github.com/tchiboub-dot/sandbox/blob/main/docs/API.md" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-primary-300 transition-colors inline-flex items-center gap-2">
              <Code2 className="w-4 h-4" /> API
            </a>
            <a href="#" className="text-slate-300 hover:text-primary-300 transition-colors inline-flex items-center gap-2">
              <LifeBuoy className="w-4 h-4" /> Support
            </a>
            <a href="https://github.com/tchiboub-dot/sandbox" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-primary-300 transition-colors inline-flex items-center gap-2">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="#" className="text-slate-300 hover:text-primary-300 transition-colors inline-flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Status
            </a>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 rounded-2xl border border-primary-300/30 bg-gradient-to-r from-primary-600/15 via-slate-900 to-primary-500/15 px-4 sm:px-6 py-4 sm:py-5 shadow-[0_0_40px_rgba(14,165,233,0.14)] text-center">
          <p className="text-slate-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base">
            <Copyright className="w-5 h-5 text-primary-300" />
            This site is reserved to Taha Adnane Chiboub
          </p>
          <p className="text-slate-400 text-sm mt-2">
            © 2026 Taha Adnane Chiboub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
