import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function Header() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Cloud Device Lab
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Virtual Devices in Your Browser
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-6">
            <a
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/admin"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              Admin
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
