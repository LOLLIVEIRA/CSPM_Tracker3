import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCheck } from 'lucide-react';
import { Misconfiguration, Resolver } from '../types';
interface AssignResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (id: string, resolver: Resolver) => void;
  misconfiguration: Misconfiguration | null;
  resolvers: Resolver[];
}
export function AssignResolverModal({
  isOpen,
  onClose,
  onAssign,
  misconfiguration,
  resolvers
}: AssignResolverModalProps) {
  const [selectedResolverEmail, setSelectedResolverEmail] = useState('');
  if (!isOpen || !misconfiguration) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedResolver = resolvers.find(r => r.email === selectedResolverEmail);
    if (selectedResolver) {
      onAssign(misconfiguration.id, selectedResolver);
      onClose();
      setSelectedResolverEmail('');
    }
  };
  return <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

        <motion.div initial={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-500" />
              Atribuir Resolvedor
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Atribuindo ticket{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                  {misconfiguration.id}
                </span>
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                {misconfiguration.description}
              </p>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Selecione o Membro da Equipe
              </label>
              <select value={selectedResolverEmail} onChange={e => setSelectedResolverEmail(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-shadow" required>
                <option value="">Selecione um resolvedor...</option>
                {resolvers.map(resolver => <option key={resolver.email} value={resolver.email}>
                    {resolver.name} ({resolver.email})
                  </option>)}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={!selectedResolverEmail} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm">
                Atribuir Ticket
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>;
}