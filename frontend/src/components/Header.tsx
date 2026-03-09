import { NavLink } from 'react-router-dom';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function Header() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <header className="bg-slate-950/75 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Monitor className="w-7 h-7 sm:w-8 sm:h-8 text-primary-300 shrink-0" />
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white truncate">
                Cloud Device Lab
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Virtual Devices in Your Browser
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm sm:text-base font-medium transition-colors ${isActive ? 'text-primary-300' : 'text-slate-300 hover:text-primary-300'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm sm:text-base font-medium transition-colors ${isActive ? 'text-primary-300' : 'text-slate-300 hover:text-primary-300'}`
              }
            >
              Admin
            </NavLink>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-white/10 shrink-0"
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
