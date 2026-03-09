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
} from 'lucide-react';
import DeviceCard from '../components/DeviceCard';
import AdvancedConfig from '../components/AdvancedConfig';
import { DeviceConfig } from '../store/sessionStore';
import { apiClient } from '../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function getLaunchErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = (error.response?.data as { error?: string; message?: string } | undefined)?.message
      || (error.response?.data as { error?: string; message?: string } | undefined)?.error;
    if (apiMessage) {
      return apiMessage;
    }
    if (!error.response) {
      return 'Backend service unavailable. Please check configuration or try again later.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Sandbox launch timed out. Please retry in a few seconds.';
    }
    if (error.response.status === 0 || error.message.toLowerCase().includes('cors')) {
      return 'Unable to start the sandbox environment due to access policy. Please contact the administrator.';
    }
    return 'Unable to start the sandbox environment. Please try again or contact the administrator.';
  }

  const message = error instanceof Error ? error.message : '';
  if (message.toLowerCase().includes('invalid api response')) {
    return 'Unable to start the sandbox environment due to invalid backend response.';
  }
  return 'Unable to start the sandbox environment. Please try again or contact the administrator.';
}

const loadingSteps = [
  'Starting Android device...',
  'Preparing cloud environment...',
  'Connecting to stream...',
];

export default function Dashboard() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'android' | 'windows' | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [retryConfig, setRetryConfig] = useState<DeviceConfig | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();

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
      const ok = await apiClient.checkBackendHealth();
      if (mounted) {
        setBackendStatus(ok ? 'online' : 'offline');
      }
    };

    pollHealth();
    const interval = setInterval(pollHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.16),transparent_30%)]"></div>

      <div className="text-center mb-10 sm:mb-12 animate-fade-in">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 sm:p-8 shadow-2xl">
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

      <section id="live-streaming" className="mb-12 sm:mb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 sm:mb-6">Live Device Streaming</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5 border border-white/10 bg-white/5">
            <div className="aspect-[9/16] max-h-80 rounded-xl border border-white/15 bg-slate-900 p-3 mx-auto w-44">
              <div className="w-full h-full rounded-lg bg-gradient-to-b from-slate-800 to-slate-950 border border-primary-300/20"></div>
            </div>
            <p className="text-slate-300 text-sm mt-4">Android stream preview with low-latency browser interaction and touch emulation.</p>
          </div>
          <div className="card p-5 border border-white/10 bg-white/5">
            <div className="aspect-video rounded-xl border border-white/15 bg-slate-900 p-3">
              <div className="w-full h-full rounded-lg bg-gradient-to-r from-slate-800 to-slate-950 border border-primary-300/20"></div>
            </div>
            <p className="text-slate-300 text-sm mt-4">Windows desktop stream preview for browser testing, workflows, and debugging sessions.</p>
          </div>
        </div>
      </section>

      <section className="mb-12 sm:mb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 sm:mb-6">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { title: 'Choose your device', icon: Smartphone },
            { title: 'Launch cloud session', icon: Play },
            { title: 'Test your website or application', icon: Globe },
            { title: 'End or reset session anytime', icon: RotateCcw },
          ].map((step, idx) => (
            <div key={step.title} className="card p-5 border border-white/10 bg-white/5">
              <div className="text-xs uppercase tracking-wider text-primary-300 mb-2">Step {idx + 1}</div>
              <div className="flex items-center gap-3">
                <step.icon className="w-5 h-5 text-primary-300" />
                <p className="text-slate-200 font-medium">{step.title}</p>
              </div>
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

      <section className="mt-14 card p-7 border border-white/10 bg-white/5">
        <h2 className="text-2xl font-bold text-white mb-4">Secure Cloud Sandbox</h2>
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
