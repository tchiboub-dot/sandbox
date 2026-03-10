import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import Header from './components/Header';
import Footer from './components/Footer';
import { EnvironmentDebugger } from './hooks/useEnvironmentCheck';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const DeviceSession = lazy(() => import('./pages/DeviceSession'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function AppLayout() {
  const location = useLocation();
  const showFooter = !location.pathname.startsWith('/session/');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading interface...</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session/:sessionId" element={<DeviceSession />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Suspense>
      {showFooter && <Footer />}
      <EnvironmentDebugger />
    </div>
  );
}

function App() {
  const { isDark } = useThemeStore();

  return (
    <div className={isDark ? 'dark' : ''}>
      <Router>
        <AppLayout />
      </Router>
    </div>
  );
}

export default App;
