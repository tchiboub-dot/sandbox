import { Play, Settings } from 'lucide-react';

interface DeviceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  specs: string[];
  onQuickLaunch: () => void;
  onAdvancedLaunch: () => void;
  isLaunching: boolean;
}

export default function DeviceCard({
  icon,
  title,
  description,
  specs,
  onQuickLaunch,
  onAdvancedLaunch,
  isLaunching,
}: DeviceCardProps) {
  return (
    <div className="card p-6 hover:shadow-xl transition-shadow duration-300 animate-fade-in">
      <div className="flex items-start space-x-4 mb-4">
        <div className="text-primary-600 dark:text-primary-400">{icon}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
          Specifications:
        </h3>
        <ul className="space-y-2">
          {specs.map((spec, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
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
          <span>Quick Launch</span>
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
