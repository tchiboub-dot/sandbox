import { useEffect, useState } from 'react';
import {
  Smartphone,
  Monitor,
  Play,
  Settings,
  ShieldCheck,
  Wrench,
  RotateCcw,
  Globe,
  Radio,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Network,
  MousePointer2,
  TrendingUp,
  Lock,
  Server,
  Clock3,
  Zap,
  Camera,
} from 'lucide-react';
import DeviceCard from '../components/DeviceCard';
import AdvancedConfig from '../components/AdvancedConfig';
import { DeviceConfig } from '../store/sessionStore';
import { apiClient } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getDeploymentInfo } from '../config/api';

function getLaunchErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to start the sandbox environment. Please try again or contact the administrator.';
}

const androidLoadingSteps = [
  'Starting Android VM',
  'Provisioning cloud resources',
  'Initializing streaming pipeline',
  'Connecting to session',
];

const windowsLoadingSteps = [
  'Starting Windows VM',
  'Provisioning cloud resources',
  'Initializing streaming pipeline',
  'Connecting to session',
];

export default function Dashboard() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'android' | 'windows' | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [retryConfig, setRetryConfig] = useState<DeviceConfig | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline' | 'misconfigured'>('checking');
  const [testUrl, setTestUrl] = useState('');
  const [uptimeDisplay, setUptimeDisplay] = useState(0);
  const [latencyDisplay, setLatencyDisplay] = useState(0);
  const [gpuDisplay, setGpuDisplay] = useState(0);
  const [nodesDisplay, setNodesDisplay] = useState(0);
  const navigate = useNavigate();
  const loadingSteps = selectedDevice === 'windows' ? windowsLoadingSteps : androidLoadingSteps;

  useEffect(() => {
    if (!isLaunching) {
      setLoadingStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1300);

    return () => clearInterval(interval);
  }, [isLaunching]);

  useEffect(() => {
    let mounted = true;

    const pollHealth = async () => {
      try {
        const health = await apiClient.checkBackendHealth();
        if (mounted) {
          if (health.isHealthy) {
            setBackendStatus('online');
          } else if (health.isConfigured) {
            setBackendStatus('offline');
          } else {
            setBackendStatus('misconfigured');
          }
        }
      } catch (error) {
        if (mounted) {
          setBackendStatus('offline');
        }
      }
    };

    if (import.meta.env.DEV) {
      console.info('[Dashboard] Deployment info:', getDeploymentInfo());
    }

    pollHealth();
    const interval = setInterval(pollHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const durationMs = 1800;
    const tickMs = 40;
    const totalTicks = durationMs / tickMs;
    let currentTick = 0;

    const timer = setInterval(() => {
      currentTick += 1;
      const progress = Math.min(currentTick / totalTicks, 1);
      setUptimeDisplay(99.9 * progress);
      setLatencyDisplay(120 * progress);
      setGpuDisplay(100 * progress);
      setNodesDisplay(Math.round(24 * progress));

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, []);

  const androidPresets: DeviceConfig = {
    type: 'android',
    version: 'Android 13',
    screenResolution: '1080x2340',
    orientation: 'portrait',
    deviceModel: 'Pixel 7',
    ram: '4GB',
    cpu: '4 cores',
    language: 'English',
    sessionDuration: 60,
    networkSpeed: '4G',
    performanceMode: 'balanced',
    resetSandboxState: true,
  };

  const windowsPresets: DeviceConfig = {
    type: 'windows',
    version: 'Windows 11',
    screenResolution: '1920x1080',
    orientation: 'landscape',
    deviceModel: 'Standard Desktop',
    ram: '8GB',
    cpu: '4 cores',
    language: 'English',
    sessionDuration: 60,
    networkSpeed: '4G',
    performanceMode: 'balanced',
    resetSandboxState: true,
  };

  const launchSession = async (config: DeviceConfig) => {
    setIsLaunching(true);
    setLaunchError(null);
    setRetryConfig(config);
    setSelectedDevice(config.type);

    if (import.meta.env.DEV) {
      console.info('[CloudDeviceLab] Launch request:', config.type);
    }

    try {
      const response = await apiClient.createSession(config);

      if (import.meta.env.DEV) {
        console.info('[CloudDeviceLab] Launch success:', config.type, 'sessionId=', response.sessionId);
      }

      navigate(`/session/${response.sessionId}`);
    } catch (error) {
      console.error('Failed to launch device:', error);

      if (import.meta.env.DEV) {
        console.error('[CloudDeviceLab] Launch failure reason:', config.type, error);
      }

      setLaunchError(getLaunchErrorMessage(error));
    } finally {
      setIsLaunching(false);
    }
  };

  const handleQuickLaunch = async (type: 'android' | 'windows') => {
    const config = type === 'android' ? androidPresets : windowsPresets;
    await launchSession(config);
  };

  const handleAdvancedLaunch = async (config: DeviceConfig) => {
    await launchSession(config);
    setShowAdvanced(false);
  };

  const handleUrlLaunch = async (type: 'android' | 'windows') => {
    const config = type === 'android' ? androidPresets : windowsPresets;
    const rawUrl = testUrl.trim();
    const normalizedUrl = rawUrl.length > 0 && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl;

    await launchSession({
      ...config,
      startUrl: normalizedUrl.length > 0 ? normalizedUrl : undefined,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.16),transparent_30%)]"></div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-starfield"></div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-animated"></div>
      <div className="pointer-events-none absolute inset-0 -z-10 cloud-lines"></div>
      <div className="pointer-events-none absolute -top-16 left-[8%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[120px] animate-drift-slow"></div>
      <div className="pointer-events-none absolute top-32 right-[10%] w-56 h-56 bg-blue-500/20 rounded-full blur-[120px] animate-drift-slower"></div>

      <div className="text-center mb-10 sm:mb-12 animate-fade-in">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none hero-glow"></div>
          <div className="absolute inset-0 pointer-events-none hero-particles"></div>
          <div className="absolute -left-8 top-8 w-20 h-36 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 animate-float-device"></div>
          <div className="absolute -right-8 top-12 w-28 h-20 rounded-xl border border-blue-300/20 bg-blue-400/5 animate-float-device-delayed"></div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-5 leading-tight drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            Run Android and Windows Devices Directly in Your Browser
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8">
            Instantly launch real cloud devices to test websites, debug applications, and browse safely
            inside isolated environments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => handleQuickLaunch('android')}
              className="btn-primary w-full sm:w-auto px-6 py-3"
              disabled={isLaunching}
            >
              Start Device Session
            </button>
            <a
              href="#live-streaming"
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-primary-400/50 text-primary-200 hover:bg-primary-500/10 transition-colors font-semibold"
            >
              Watch Demo
            </a>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs sm:text-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400'
                  : backendStatus === 'offline'
                  ? 'bg-red-400'
                  : 'bg-yellow-400'
              }`}
            ></span>
            <span className="text-slate-300">
              Backend Status:{' '}
              {backendStatus === 'online'
                ? 'Connected'
                : backendStatus === 'offline'
                ? 'Unavailable'
                : 'Checking...'}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
            {['Secure Cloud Sandbox', 'No Installation Required', 'Real Device Simulation'].map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-emerald-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {launchError && (
        <div className="mb-8 rounded-xl border border-red-400/40 bg-red-950/40 p-4 sm:p-5 shadow-lg">
          <p className="text-red-200 font-medium">{launchError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (retryConfig) {
                  launchSession(retryConfig);
                }
              }}
              className="btn-primary"
              disabled={isLaunching || !retryConfig}
            >
              Retry
            </button>
            <button
              onClick={() => setLaunchError(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 sm:gap-8 mb-8">
        <DeviceCard
          icon={<Smartphone className="w-10 h-10" />}
          title="Android Virtual Device"
          description="Real Android environment optimized for browser, UI, and mobile workflow testing in secure cloud sessions."
          specs={[
            'Android 10, 11, 12, or 13',
            '1080x2340 display',
            '4GB RAM',
            '4-core CPU',
            'Chrome browser',
            'Developer tools',
          ]}
          badges={['Android 13', 'Chrome Browser', 'Mobile Testing', 'Developer Tools']}
          statusBadges={['Available', 'Cloud Ready']}
          averageStartTime="4-7 seconds"
          launchLabel="Launch Android Device"
          onQuickLaunch={() => handleQuickLaunch('android')}
          onAdvancedLaunch={() => {
            setSelectedDevice('android');
            setShowAdvanced(true);
          }}
          isLaunching={isLaunching}
        />

        <DeviceCard
          icon={<Monitor className="w-10 h-10" />}
          title="Windows Virtual Machine"
          description="Cloud-hosted Windows desktop for full browser validation, desktop workflows, and enterprise QA sessions."
          specs={[
            'Windows 10 or 11',
            '1920x1080 display',
            '8GB RAM',
            '4-core CPU',
            'Microsoft Edge',
            'Developer tools',
          ]}
          badges={['Windows 11', 'Edge Browser', 'Desktop Testing', 'Developer Tools']}
          statusBadges={['Available', 'Low Latency']}
          averageStartTime="4-7 seconds"
          launchLabel="Launch Windows Machine"
          onQuickLaunch={() => handleQuickLaunch('windows')}
          onAdvancedLaunch={() => {
            setSelectedDevice('windows');
            setShowAdvanced(true);
          }}
          isLaunching={isLaunching}
        />
      </div>

      {!showAdvanced && (
        <div className="text-center mb-10 sm:mb-12">
          <button
            onClick={() => setShowAdvanced(true)}
            className="inline-flex items-center space-x-2 text-primary-300 hover:text-primary-200 font-medium transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Advanced Launch Configuration</span>
          </button>
        </div>
      )}

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

      <section className="mb-12 sm:mb-14 card p-5 sm:p-7 border border-white/10 bg-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-primary-300" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Test URL in Sandbox</h2>
        </div>
        <p className="text-slate-300 text-sm sm:text-base mb-4">
          Enter a URL and launch a cloud device to start validation immediately inside an isolated environment.
        </p>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="input"
            placeholder="Enter URL to test (e.g. https://example.com)"
          />
          <button
            onClick={() => handleUrlLaunch('android')}
            disabled={isLaunching}
            className="btn-primary"
          >
            Launch Android with URL
          </button>
          <button
            onClick={() => handleUrlLaunch('windows')}
            disabled={isLaunching}
            className="btn-secondary"
          >
            Launch Windows with URL
          </button>
        </div>
      </section>

      <section id="live-streaming" className="mb-12 sm:mb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 sm:mb-6">Live Device Streaming</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5 border border-white/10 bg-white/5">
            <div className="aspect-[9/16] max-h-80 rounded-xl border border-white/15 bg-slate-900 p-3 mx-auto w-44 relative overflow-hidden">
              <div className="w-full h-full rounded-lg bg-gradient-to-b from-slate-800 to-slate-950 border border-primary-300/20 overflow-hidden relative">
                <div className="h-6 border-b border-white/10 bg-slate-900/70"></div>
                <div className="absolute top-10 left-2 right-2 bottom-2 rounded-md bg-slate-800/60">
                  <div className="h-2 w-16 bg-cyan-300/40 rounded mt-2 ml-2 animate-pulse"></div>
                  <div className="h-2 w-20 bg-slate-400/30 rounded mt-2 ml-2"></div>
                  <div className="h-28 mt-3 mx-2 rounded bg-gradient-to-b from-slate-700/60 to-slate-900/80 animate-scroll-preview"></div>
                </div>
                <MousePointer2 className="w-4 h-4 text-cyan-300 absolute bottom-6 right-6 animate-touch-indicator" />
              </div>
            </div>
            <p className="text-slate-300 text-sm mt-4">Android preview with loading website animation, touch indicator, and smooth browser scrolling.</p>
          </div>
          <div className="card p-5 border border-white/10 bg-white/5">
            <div className="aspect-video rounded-xl border border-white/15 bg-slate-900 p-3 relative overflow-hidden">
              <div className="w-full h-full rounded-lg bg-gradient-to-r from-slate-800 to-slate-950 border border-primary-300/20 relative overflow-hidden">
                <div className="h-8 border-b border-white/10 bg-slate-900/70"></div>
                <div className="absolute top-11 left-3 w-28 h-20 rounded border border-slate-500/30 bg-slate-800/70 animate-window-pop"></div>
                <div className="absolute top-16 right-4 w-40 h-20 rounded border border-cyan-400/20 bg-slate-900/70"></div>
                <MousePointer2 className="w-4 h-4 text-cyan-300 absolute top-14 left-14 animate-pointer-drift" />
              </div>
            </div>
            <p className="text-slate-300 text-sm mt-4">Windows preview with animated cursor movement, app window opening, and developer-console style panes.</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mt-4 inline-flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-300" /> Low-latency WebRTC streaming delivers device screens directly to your browser.
        </p>
      </section>

      <section className="mb-12 sm:mb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 sm:mb-6">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4 relative">
          {[
            { title: 'Choose your device', icon: Smartphone },
            { title: 'Launch cloud session', icon: Play },
            { title: 'Test your website or application', icon: Globe },
            { title: 'End or reset session anytime', icon: RotateCcw },
          ].map((step, idx) => (
            <div key={step.title} className="card p-5 border border-white/10 bg-white/5 relative">
              <div className="text-xs uppercase tracking-wider text-primary-300 mb-2">Step {idx + 1}</div>
              <div className="flex items-center gap-3">
                <step.icon className="w-5 h-5 text-primary-300" />
                <p className="text-slate-200 font-medium">{step.title}</p>
              </div>
              {idx < 3 && (
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300/80 animate-arrow-pulse" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="card p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-primary-100/10 rounded-lg flex items-center justify-center mb-4 border border-primary-300/30">
            <Play className="w-6 h-6 text-primary-300" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Instant Launch</h3>
          <p className="text-slate-300 text-sm">Start real virtual devices in seconds with preconfigured cloud runtime profiles.</p>
        </div>

        <div className="card p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-green-100/10 rounded-lg flex items-center justify-center mb-4 border border-green-300/30">
            <Radio className="w-6 h-6 text-green-300" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Real-Time Streaming</h3>
          <p className="text-slate-300 text-sm">Interact with cloud devices through low-latency WebRTC streaming directly in your browser.</p>
        </div>

        <div className="card p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-indigo-100/10 rounded-lg flex items-center justify-center mb-4 border border-indigo-300/30">
            <ShieldCheck className="w-6 h-6 text-indigo-300" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Fully Isolated</h3>
          <p className="text-slate-300 text-sm">Every session runs in a secure isolated sandbox with automatic lifecycle cleanup.</p>
        </div>

        <div className="card p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-cyan-100/10 rounded-lg flex items-center justify-center mb-4 border border-cyan-300/30">
            <Wrench className="w-6 h-6 text-cyan-300" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Developer Tools</h3>
          <p className="text-slate-300 text-sm">Validate UI behavior, inspect layouts, and debug workflows with production-like tooling.</p>
        </div>

        <div className="card p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-amber-100/10 rounded-lg flex items-center justify-center mb-4 border border-amber-300/30">
            <RotateCcw className="w-6 h-6 text-amber-300" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Device Reset</h3>
          <p className="text-slate-300 text-sm">Reboot or reset environments instantly to retest flows from a clean state.</p>
        </div>

        <div className="card p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-emerald-100/10 rounded-lg flex items-center justify-center mb-4 border border-emerald-300/30">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Secure Testing</h3>
          <p className="text-slate-300 text-sm">Keep testing isolated from your local machine with controlled sessions and secure cleanup.</p>
        </div>
      </section>

      <section className="mt-12 grid lg:grid-cols-4 gap-4">
        {[ 
          { label: '99.9% uptime', value: `${uptimeDisplay.toFixed(1)}%`, icon: Server },
          { label: '<120 ms latency', value: `<${Math.max(1, Math.round(latencyDisplay))} ms`, icon: Clock3 },
          { label: 'GPU accelerated streaming', value: `${Math.round(gpuDisplay)}%`, icon: TrendingUp },
          { label: 'Global cloud nodes', value: `${nodesDisplay}+`, icon: Globe },
        ].map((item) => (
          <div key={item.label} className="card p-5 border border-white/10 bg-white/5">
            <item.icon className="w-5 h-5 text-cyan-300 mb-2" />
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="text-sm text-slate-300 mt-1">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 card p-7 border border-white/10 bg-white/5">
        <h2 className="text-2xl font-bold text-white mb-4">Sandbox Session Controls</h2>
        <p className="text-slate-300 mb-4">Users control each virtual device in real time with direct operational actions.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: RotateCcw, label: 'Restart Device' },
            { icon: Wrench, label: 'Reset Device' },
            { icon: Camera, label: 'Take Screenshot' },
            { icon: ShieldCheck, label: 'End Session' },
          ].map((action) => (
            <div key={action.label} className="rounded-xl border border-white/10 bg-slate-950/70 p-4 hover:border-cyan-300/40 transition-colors">
              <action.icon className="w-5 h-5 text-cyan-300 mb-2" />
              <p className="text-slate-200 text-sm font-medium">{action.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 card p-7 border border-white/10 bg-white/5">
        <h2 className="text-2xl font-bold text-white mb-4">Secure Cloud Sandbox</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { icon: Network, title: 'Network Isolation' },
            { icon: Server, title: 'Temporary VMs' },
            { icon: Lock, title: 'Encrypted Streaming' },
            { icon: RotateCcw, title: 'Auto Session Cleanup' },
          ].map((security) => (
            <div key={security.title} className="rounded-lg border border-cyan-300/20 px-3 py-2 bg-cyan-500/10 text-cyan-100 text-sm flex items-center gap-2 animate-soft-pulse">
              <security.icon className="w-4 h-4" />
              <span>{security.title}</span>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            'fully isolated environments',
            'no access to host system',
            'automatic session cleanup',
            'safe browsing environment',
            'controlled testing sessions',
          ].map((point) => (
            <div key={point} className="rounded-lg border border-white/10 px-3 py-2 bg-slate-900/70 text-slate-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-300" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 card p-7 border border-white/10 bg-white/5">
        <h2 className="text-2xl font-bold text-white mb-4">Why Use This Platform</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            'Test websites on real environments',
            'No emulator installation',
            'Fast debugging workflow',
            'Secure isolated sessions',
          ].map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-slate-950/70 p-4 text-slate-200 inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-300" /> {item}
            </div>
          ))}
        </div>
      </section>

      {isLaunching && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-primary-400/40 bg-slate-950/90 p-6 shadow-2xl shadow-primary-500/20">
            <p className="text-primary-200 text-sm mb-2">Launching cloud session</p>
            <h3 className="text-white text-xl font-semibold mb-5">{loadingSteps[loadingStepIndex]}</h3>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-cyan-400 animate-progress-slide"></div>
            </div>
            <div className="mt-4 text-slate-400 text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Provisioning secure VM resources and stream pipeline.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
