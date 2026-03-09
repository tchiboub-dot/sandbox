import { useState } from 'react';
import { Smartphone, Monitor, Play, Settings } from 'lucide-react';
import DeviceCard from '../components/DeviceCard';
import AdvancedConfig from '../components/AdvancedConfig';
import { DeviceConfig } from '../store/sessionStore';
import { apiClient } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'android' | 'windows' | null>(null);
  const navigate = useNavigate();

  const androidPresets: DeviceConfig = {
    type: 'android',
    version: 'Android 13',
    screenResolution: '1080x2340',
    ram: '4GB',
    cpu: '4 cores',
    language: 'English',
    sessionDuration: 60,
  };

  const windowsPresets: DeviceConfig = {
    type: 'windows',
    version: 'Windows 11',
    screenResolution: '1920x1080',
    ram: '8GB',
    cpu: '4 cores',
    language: 'English',
    sessionDuration: 60,
  };

  const handleQuickLaunch = async (type: 'android' | 'windows') => {
    setIsLaunching(true);
    try {
      const config = type === 'android' ? androidPresets : windowsPresets;
      const response = await apiClient.createSession(config);
      navigate(`/session/${response.sessionId}`);
    } catch (error) {
      console.error('Failed to launch device:', error);
      alert('Failed to launch device. Please try again.');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleAdvancedLaunch = async (config: DeviceConfig) => {
    setIsLaunching(true);
    try {
      const response = await apiClient.createSession(config);
      navigate(`/session/${response.sessionId}`);
    } catch (error) {
      console.error('Failed to launch device:', error);
      alert('Failed to launch device. Please try again.');
    } finally {
      setIsLaunching(false);
      setShowAdvanced(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Launch Virtual Devices
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Test your websites and applications on real Android and Windows devices running in the cloud.
          Stream directly to your browser with zero setup.
        </p>
      </div>

      {/* Device Selection Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <DeviceCard
          icon={<Smartphone className="w-12 h-12" />}
          title="Android Virtual Device"
          description="Real Android system with Chrome browser, touch simulation, and debugging tools"
          specs={[
            'Android 10, 11, 12, or 13',
            '1080x2340 display',
            '4GB RAM',
            '4-core CPU',
            'Chrome browser',
            'Developer tools',
          ]}
          onQuickLaunch={() => handleQuickLaunch('android')}
          onAdvancedLaunch={() => {
            setSelectedDevice('android');
            setShowAdvanced(true);
          }}
          isLaunching={isLaunching}
        />

        <DeviceCard
          icon={<Monitor className="w-12 h-12" />}
          title="Windows Virtual Machine"
          description="Full Windows desktop with Edge browser, file explorer, and developer console"
          specs={[
            'Windows 10 or 11',
            '1920x1080 display',
            '8GB RAM',
            '4-core CPU',
            'Microsoft Edge',
            'Developer tools',
          ]}
          onQuickLaunch={() => handleQuickLaunch('windows')}
          onAdvancedLaunch={() => {
            setSelectedDevice('windows');
            setShowAdvanced(true);
          }}
          isLaunching={isLaunching}
        />
      </div>

      {/* Advanced Configuration Button */}
      {!showAdvanced && (
        <div className="text-center">
          <button
            onClick={() => setShowAdvanced(true)}
            className="inline-flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Advanced Launch Configuration</span>
          </button>
        </div>
      )}

      {/* Advanced Configuration Panel */}
      {showAdvanced && (
        <AdvancedConfig
          deviceType={selectedDevice || 'android'}
          onLaunch={handleAdvancedLaunch}
          onCancel={() => {
            setShowAdvanced(false);
            setSelectedDevice(null);
          }}
          isLaunching={isLaunching}
        />
      )}

      {/* Features Section */}
      <div className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
            <Play className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Instant Launch</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Start a virtual device in seconds with one click. No installation or configuration required.
          </p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Real-Time Streaming</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Low-latency WebRTC streaming brings the device screen directly to your browser.
          </p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Fully Isolated</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Each session runs in a secure, isolated environment that's destroyed when you're done.
          </p>
        </div>
      </div>
    </div>
  );
}
