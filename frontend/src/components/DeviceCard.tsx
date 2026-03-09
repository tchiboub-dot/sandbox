import { Play, Settings } from 'lucide-react';

interface DeviceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  specs: string[];
  badges: string[];
  launchLabel: string;
  onQuickLaunch: () => void;
  onAdvancedLaunch: () => void;
  isLaunching: boolean;
}

export default function DeviceCard({
  icon,
  title,
  description,
  specs,
  badges,
  launchLabel,
  onQuickLaunch,
  onAdvancedLaunch,
  isLaunching,
}: DeviceCardProps) {
  const isAndroid = title.toLowerCase().includes('android');

  return (
    <div className="card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in border border-white/10 hover:border-primary-400/60 hover:shadow-primary-500/20">
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 mb-5">
        <div className={`mx-auto ${isAndroid ? 'w-24 h-44 rounded-2xl' : 'w-48 h-32 rounded-lg'} border border-white/20 bg-slate-950 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.25),transparent_40%)]"></div>
          <div className="absolute top-2 left-2 right-2 flex justify-between text-[10px] text-slate-400">
            <span>{isAndroid ? '12:41' : 'Cloud VM'}</span>
            <span>{isAndroid ? '5G' : 'Online'}</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-2/3 rounded-md border border-primary-400/30 bg-slate-900/70"></div>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-4 mb-4">
        <div className="text-primary-300 bg-primary-500/10 border border-primary-400/30 p-3 rounded-xl">{icon}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2 text-white">{title}</h2>
          <p className="text-slate-300">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {badges.map((badge) => (
          <span
            key={badge}
            className="px-2.5 py-1 rounded-full text-xs font-medium border border-primary-300/30 bg-primary-500/10 text-primary-200"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-sm text-slate-300 mb-3">
          Specifications:
        </h3>
        <ul className="space-y-2">
          {specs.map((spec, index) => (
            <li key={index} className="flex items-center text-sm text-slate-300">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
              {spec}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onQuickLaunch}
          disabled={isLaunching}
          className="btn-primary flex-1 flex items-center justify-center space-x-2"
        >
          <Play className="w-5 h-5" />
          <span>{launchLabel}</span>
        </button>
        <button
          onClick={onAdvancedLaunch}
          disabled={isLaunching}
          className="btn-secondary flex items-center justify-center space-x-2 px-4"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
