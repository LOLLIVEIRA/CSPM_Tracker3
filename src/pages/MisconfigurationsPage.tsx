import React from 'react';
import { Misconfiguration, FilterState, Resolver } from '../types';
import { MisconfigurationsTable } from '../components/MisconfigurationsTable';
import { FilterPanel } from '../components/FilterPanel';
import { Search } from 'lucide-react';
interface MisconfigurationsPageProps {
  data: Misconfiguration[];
  resolvers: Resolver[];
  filters: FilterState;
  onUpdateFilter: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
  onAssign: (id: string, resolver: Resolver) => void;
  onDelete: (id: string) => void;
}
export function MisconfigurationsPage({
  data,
  resolvers,
  filters,
  onUpdateFilter,
  onClearFilters,
  onAssign,
  onDelete
}: MisconfigurationsPageProps) {
  return <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      {/* Sidebar Filters */}
      <FilterPanel filters={filters} onUpdate={onUpdateFilter} onClear={onClearFilters} />

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Tickets
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Mostrando {data.length} tickets correspondentes
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="Buscar recursos, IDs..." value={filters.search} onChange={e => onUpdateFilter('search', e.target.value)} className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-shadow" />
          </div>
        </div>

        <MisconfigurationsTable data={data} resolvers={resolvers} onAssign={onAssign} onDelete={onDelete} />
      </div>
    </div>;
}