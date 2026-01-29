import React from 'react';
import { Provider } from '../types';
import { Cloud, Server, Database } from 'lucide-react';
interface ProviderBadgeProps {
  provider: Provider;
}
export function ProviderBadge({
  provider
}: ProviderBadgeProps) {
  const getIcon = () => {
    switch (provider) {
      case 'AWS':
        return <Cloud className="w-3 h-3 mr-1" />;
      case 'GCP':
        return <Server className="w-3 h-3 mr-1" />;
      case 'Azure':
        return <Database className="w-3 h-3 mr-1" />;
    }
  };
  const getColors = () => {
    switch (provider) {
      case 'AWS':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'GCP':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'Azure':
        return 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20';
    }
  };
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getColors()}`}>
      {getIcon()}
      {provider}
    </span>;
}