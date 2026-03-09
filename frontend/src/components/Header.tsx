import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function Header() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <header className="bg-slate-950/75 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-primary-300" />
            <div>
              <h1 className="text-xl font-bold text-white">
                Cloud Device Lab
              </h1>
              <p className="text-xs text-slate-400">
                Virtual Devices in Your Browser
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-6">
            <a
              href="/"
              className="text-slate-300 hover:text-primary-300 font-medium transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/admin"
              className="text-slate-300 hover:text-primary-300 font-medium transition-colors"
            >
              Admin
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-white/10"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
