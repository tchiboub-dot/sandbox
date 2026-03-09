import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import Dashboard from './pages/Dashboard';
import DeviceSession from './pages/DeviceSession';
import AdminPanel from './pages/AdminPanel';
import Header from './components/Header';
import Footer from './components/Footer';

function AppLayout() {
  const location = useLocation();
  const showFooter = !location.pathname.startsWith('/session/');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/session/:sessionId" element={<DeviceSession />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      {showFooter && <Footer />}
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
