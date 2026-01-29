import React from 'react';
import { FilterState, Severity, Provider, Status } from '../types';
import { Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';
interface FilterPanelProps {
  filters: FilterState;
  onUpdate: (key: keyof FilterState, value: any) => void;
  onClear: () => void;
}
export function FilterPanel({
  filters,
  onUpdate,
  onClear
}: FilterPanelProps) {
  const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMAL'];
  const providers: Provider[] = ['AWS', 'GCP', 'Azure'];
  const statuses: Status[] = ['Open', 'In Progress', 'Resolved', 'Overdue'];
  const toggleFilter = <T extends string,>(current: T[], value: T, key: keyof FilterState) => {
    const newValues = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onUpdate(key, newValues);
  };
  return <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Filter size={20} />
          Filtros
        </h2>
        <button onClick={onClear} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Limpar tudo
        </button>
      </div>

      {/* Severity Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">
          Severidade
        </h3>
        <div className="space-y-2">
          {severities.map(severity => <label key={severity} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" checked={filters.severity.includes(severity)} onChange={() => toggleFilter(filters.severity, severity, 'severity')} className="peer h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                {severity}
              </span>
            </label>)}
        </div>
      </div>

      {/* Provider Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">
          Provider
        </h3>
        <div className="space-y-2">
          {providers.map(provider => <label key={provider} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={filters.provider.includes(provider)} onChange={() => toggleFilter(filters.provider, provider, 'provider')} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800" />
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                {provider}
              </span>
            </label>)}
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">
          Status
        </h3>
        <div className="space-y-2">
          {statuses.map(status => {
          const statusLabels: Record<Status, string> = {
            Open: 'Aberto',
            'In Progress': 'Em Progresso',
            Resolved: 'Resolvido',
            Overdue: 'Vencido'
          };
          return <label key={status} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={filters.status.includes(status)} onChange={() => toggleFilter(filters.status, status, 'status')} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800" />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  {statusLabels[status]}
                </span>
              </label>;
        })}
        </div>
      </div>

      {/* Resolver Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">
          Resolvedor
        </h3>
        <input type="text" placeholder="Buscar resolvedor..." value={filters.resolver} onChange={e => onUpdate('resolver', e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-shadow" />
      </div>
    </div>;
}