import { useState } from 'react';
import { X, Play } from 'lucide-react';
import { DeviceConfig } from '../store/sessionStore';

interface AdvancedConfigProps {
  deviceType: 'android' | 'windows';
  onLaunch: (config: DeviceConfig) => void;
  onCancel: () => void;
  isLaunching: boolean;
}

export default function AdvancedConfig({
  deviceType,
  onLaunch,
  onCancel,
  isLaunching,
}: AdvancedConfigProps) {
  const [config, setConfig] = useState<DeviceConfig>({
    type: deviceType,
    version: deviceType === 'android' ? 'Android 13' : 'Windows 11',
    screenResolution: deviceType === 'android' ? '1080x2340' : '1920x1080',
    orientation: deviceType === 'android' ? 'portrait' : 'landscape',
    deviceModel: deviceType === 'android' ? 'Pixel 7' : 'Standard Desktop',
    ram: deviceType === 'android' ? '4GB' : '8GB',
    cpu: '4 cores',
    language: 'English',
    sessionDuration: 60,
    networkSpeed: '4G',
    performanceMode: 'balanced',
    resetSandboxState: true,
    locationCity: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
  });

  const androidVersions = ['Android 10', 'Android 11', 'Android 12', 'Android 13'];
  const windowsVersions = ['Windows 10', 'Windows 11'];
  const androidResolutions = ['720x1280', '1080x1920', '1080x2340', '1440x3040'];
  const windowsResolutions = ['1280x720', '1920x1080', '2560x1440', '3840x2160'];
  const androidModels = ['Pixel 7', 'Samsung S23', 'OnePlus 11', 'Xiaomi 13'];
  const windowsPresets = ['Standard Desktop', 'Enterprise Desktop', 'High Performance VM'];
  const ramOptions = config.type === 'android' ? ['2GB', '4GB', '6GB', '8GB'] : ['4GB', '8GB', '16GB', '32GB'];
  const cpuOptions = ['2 cores', '4 cores', '6 cores', '8 cores'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese'];
  const networkSpeeds = ['3G', '4G', '5G', 'Slow network', 'Offline mode'];
  const performanceModes: Array<'balanced' | 'high-performance' | 'battery-saver'> = ['balanced', 'high-performance', 'battery-saver'];
  const cities = [
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Berlin', lat: 52.52, lng: 13.405 },
  ];
  const durations = [30, 60, 120, 180, 240];

  const handleCityChange = (cityName: string) => {
    const city = cities.find((item) => item.name === cityName);
    setConfig({
      ...config,
      locationCity: cityName,
      latitude: city?.lat ?? config.latitude,
      longitude: city?.lng ?? config.longitude,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLaunch(config);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fade-in border border-white/10 bg-slate-900/95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Advanced Launch Configuration</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Device Type */}
            <div>
              <label className="label">Device Type</label>
              <select
                value={config.type}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    type: e.target.value as 'android' | 'windows',
                    version: e.target.value === 'android' ? 'Android 13' : 'Windows 11',
                    screenResolution: e.target.value === 'android' ? '1080x2340' : '1920x1080',
                    orientation: e.target.value === 'android' ? 'portrait' : 'landscape',
                    deviceModel: e.target.value === 'android' ? 'Pixel 7' : 'Standard Desktop',
                    ram: e.target.value === 'android' ? '4GB' : '8GB',
                  })
                }
                className="select"
              >
                <option value="android">Android Virtual Device</option>
                <option value="windows">Windows Virtual Machine</option>
              </select>
            </div>

            {/* OS Version */}
            <div>
              <label className="label">
                {config.type === 'android' ? 'Android Version' : 'Windows Version'}
              </label>
              <select
                value={config.version}
                onChange={(e) => setConfig({ ...config, version: e.target.value })}
                className="select"
              >
                {(config.type === 'android' ? androidVersions : windowsVersions).map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Model Preset */}
            <div>
              <label className="label">Device Model Preset</label>
              <select
                value={config.deviceModel}
                onChange={(e) => setConfig({ ...config, deviceModel: e.target.value })}
                className="select"
              >
                {(config.type === 'android' ? androidModels : windowsPresets).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Screen Resolution */}
            <div>
              <label className="label">Screen Resolution</label>
              <select
                value={config.screenResolution}
                onChange={(e) => setConfig({ ...config, screenResolution: e.target.value })}
                className="select"
              >
                {(config.type === 'android' ? androidResolutions : windowsResolutions).map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="label">Orientation</label>
              <select
                value={config.orientation}
                onChange={(e) => setConfig({ ...config, orientation: e.target.value as 'portrait' | 'landscape' })}
                className="select"
                disabled={config.type === 'windows'}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {/* RAM */}
            <div>
              <label className="label">RAM Allocation</label>
              <select
                value={config.ram}
                onChange={(e) => setConfig({ ...config, ram: e.target.value })}
                className="select"
              >
                {ramOptions.map((ram) => (
                  <option key={ram} value={ram}>
                    {ram}
                  </option>
                ))}
              </select>
            </div>

            {/* CPU */}
            <div>
              <label className="label">CPU Allocation</label>
              <select
                value={config.cpu}
                onChange={(e) => setConfig({ ...config, cpu: e.target.value })}
                className="select"
              >
                {cpuOptions.map((cpu) => (
                  <option key={cpu} value={cpu}>
                    {cpu}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="label">System Language</label>
              <select
                value={config.language}
                onChange={(e) => setConfig({ ...config, language: e.target.value })}
                className="select"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Network Speed */}
            <div>
              <label className="label">Network Speed Simulation</label>
              <select
                value={config.networkSpeed}
                onChange={(e) => setConfig({ ...config, networkSpeed: e.target.value })}
                className="select"
              >
                {networkSpeeds.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}
                  </option>
                ))}
              </select>
            </div>

            {/* Performance Mode */}
            <div>
              <label className="label">Performance Mode</label>
              <select
                value={config.performanceMode}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    performanceMode: e.target.value as 'balanced' | 'high-performance' | 'battery-saver',
                  })
                }
                className="select"
              >
                {performanceModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Duration */}
            <div>
              <label className="label">Session Duration (minutes)</label>
              <select
                value={config.sessionDuration}
                onChange={(e) => setConfig({ ...config, sessionDuration: Number(e.target.value) })}
                className="select"
              >
                {durations.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} minutes
                  </option>
                ))}
              </select>
            </div>

            {/* City Selection */}
            <div>
              <label className="label">Location Simulation (City)</label>
              <select
                value={config.locationCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="select"
              >
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Latitude */}
            <div>
              <label className="label">Custom Latitude</label>
              <input
                className="input"
                type="number"
                step="0.0001"
                value={config.latitude}
                onChange={(e) => setConfig({ ...config, latitude: Number(e.target.value) })}
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="label">Custom Longitude</label>
              <input
                className="input"
                type="number"
                step="0.0001"
                value={config.longitude}
                onChange={(e) => setConfig({ ...config, longitude: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <label className="inline-flex items-center gap-3 text-slate-200 text-sm font-medium">
              <input
                type="checkbox"
                checked={Boolean(config.resetSandboxState)}
                onChange={(e) => setConfig({ ...config, resetSandboxState: e.target.checked })}
              />
              Reset sandbox state on launch
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
            <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLaunching}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center space-x-2" disabled={isLaunching}>
              <Play className="w-5 h-5" />
              <span>{isLaunching ? 'Launching...' : 'Launch Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
