import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Misconfiguration, Resolver } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { ProviderBadge } from './ProviderBadge';
import { StatusBadge } from './StatusBadge';
import { AssignResolverModal } from './AssignResolverModal';
import { Clock, UserPlus, ChevronDown, ChevronUp, Search, Eye, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmationDialog } from './ConfirmationDialog';
interface MisconfigurationsTableProps {
  data: Misconfiguration[];
  resolvers: Resolver[];
  onAssign: (id: string, resolver: Resolver) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}
export function MisconfigurationsTable({
  data,
  resolvers,
  onAssign,
  onDelete,
  compact = false
}: MisconfigurationsTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<keyof Misconfiguration>('detectedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedItem, setSelectedItem] = useState<Misconfiguration | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Misconfiguration | null>(null);
  const handleSort = (field: keyof Misconfiguration) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  const SortIcon = ({
    field
  }: {
    field: keyof Misconfiguration;
  }) => {
    if (sortField !== field) return <div className="w-4 h-4 opacity-0" />;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };
  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
    if (diff < 0) return {
      text: 'Vencido',
      color: 'text-red-600 dark:text-red-400'
    };
    if (days > 0) return {
      text: `${days}d ${hours}h`,
      color: 'text-slate-600 dark:text-slate-400'
    };
    return {
      text: `${hours}h restantes`,
      color: 'text-orange-600 dark:text-orange-400 font-bold'
    };
  };
  return <>
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-2">
                  ID <SortIcon field="id" />
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('severity')}>
                <div className="flex items-center gap-2">
                  Severidade <SortIcon field="severity" />
                </div>
              </th>
              {!compact && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('provider')}>
                  <div className="flex items-center gap-2">
                    Provider <SortIcon field="provider" />
                  </div>
                </th>}
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">
                Descrição
              </th>
              {!compact && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('resolver')}>
                  <div className="flex items-center gap-2">
                    Resolvedor <SortIcon field="resolver" />
                  </div>
                </th>}
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-2">
                  Status <SortIcon field="status" />
                </div>
              </th>
              {!compact && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('slaDeadline')}>
                  <div className="flex items-center gap-2">
                    SLA <SortIcon field="slaDeadline" />
                  </div>
                </th>}
              <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {sortedData.map((item, index) => <motion.tr key={item.id} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.03
          }} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => navigate(`/ticket/${item.id}`)}>
                <td className="p-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                  {item.id}
                </td>
                <td className="p-4">
                  <SeverityBadge severity={item.severity} />
                </td>
                {!compact && <td className="p-4">
                    <ProviderBadge provider={item.provider} />
                  </td>}
                <td className="p-4">
                  <div className="max-w-md">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={item.description}>
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 truncate" title={item.resource}>
                      {item.resource}
                    </p>
                  </div>
                </td>
                {!compact && <td className="p-4">
                    {item.resolver ? <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300">
                          {item.resolver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {item.resolver.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.resolver.email}
                          </p>
                        </div>
                      </div> : <span className="text-sm text-slate-400 italic">
                        Não atribuído
                      </span>}
                  </td>}
                <td className="p-4">
                  <StatusBadge status={item.status} />
                </td>
                {!compact && <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock size={14} className="text-slate-400" />
                      <span className={getTimeRemaining(item.slaDeadline).color}>
                        {getTimeRemaining(item.slaDeadline).text}
                      </span>
                    </div>
                  </td>}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={e => {
                  e.stopPropagation();
                  navigate(`/ticket/${item.id}`);
                }} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Ver detalhes">
                      <Eye size={18} />
                    </button>
                    <button onClick={e => {
                  e.stopPropagation();
                  setSelectedItem(item);
                }} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Atribuir resolvedor">
                      <UserPlus size={18} />
                    </button>
                    <button onClick={e => {
                  e.stopPropagation();
                  setTicketToDelete(item);
                }} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir ticket">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>)}

            {sortedData.length === 0 && <tr>
                <td colSpan={compact ? 5 : 8} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      Nenhum ticket encontrado
                    </p>
                    <p className="text-sm">Tente ajustar os filtros</p>
                  </div>
                </td>
              </tr>}
          </tbody>
        </table>
      </div>

      <AssignResolverModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onAssign={onAssign} misconfiguration={selectedItem} resolvers={resolvers} />

      <ConfirmationDialog
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={() => {
          if (ticketToDelete) {
            onDelete(ticketToDelete.id);
            setTicketToDelete(null);
          }
        }}
        title="Excluir ticket"
        message={`Tem certeza que deseja excluir o ticket "${ticketToDelete?.id}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </>;
}