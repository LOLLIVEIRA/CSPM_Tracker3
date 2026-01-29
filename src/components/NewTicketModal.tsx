import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Misconfiguration, Severity, Provider, Status, Resolver } from '../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (ticket: Omit<Misconfiguration, 'id' | 'detectedAt' | 'crowdstrikeId' | 'slaDeadline'>) => void;
  resolvers: Resolver[];
}

export function NewTicketModal({
  isOpen,
  onClose,
  onCreate,
  resolvers
}: NewTicketModalProps) {
  const [formData, setFormData] = useState({
    severity: 'MEDIUM' as Severity,
    provider: 'AWS' as Provider,
    resource: '',
    description: '',
    resolverEmail: '',
    status: 'Open' as Status
  });
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedResolver = resolvers.find(r => r.email === formData.resolverEmail);
    onCreate({
      ...formData,
      resolver: selectedResolver || null
      // slaDeadline será calculado automaticamente no createTicket baseado em CVSS
    });
    setFormData({
      severity: 'MEDIUM',
      provider: 'AWS',
      resource: '',
      description: '',
      resolverEmail: '',
      status: 'Open'
    });
    onClose();
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
      }} className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Novo Ticket
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Severidade *
                </label>
                <select value={formData.severity} onChange={e => setFormData({
                ...formData,
                severity: e.target.value as Severity
              })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white" required>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                  <option value="INFORMAL">INFORMAL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Provider *
                </label>
                <select value={formData.provider} onChange={e => setFormData({
                ...formData,
                provider: e.target.value as Provider
              })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white" required>
                  <option value="AWS">AWS</option>
                  <option value="GCP">GCP</option>
                  <option value="Azure">Azure</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Recurso *
              </label>
              <input type="text" value={formData.resource} onChange={e => setFormData({
              ...formData,
              resource: e.target.value
            })} placeholder="Ex: s3://bucket-name ou vm-instance-123" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white font-mono text-sm" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descrição *
              </label>
              <textarea value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} placeholder="Descreva a misconfiguration encontrada..." rows={3} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white resize-none" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Resolvedor
                </label>
                <select value={formData.resolverEmail} onChange={e => setFormData({
                ...formData,
                resolverEmail: e.target.value
              })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white">
                  <option value="">Não atribuído</option>
                  {resolvers.map(resolver => <option key={resolver.email} value={resolver.email}>
                      {resolver.name} ({resolver.email})
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status *
                </label>
                <select value={formData.status} onChange={e => setFormData({
                ...formData,
                status: e.target.value as Status
              })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white" required>
                  <option value="Open">Aberto</option>
                  <option value="In Progress">Em Progresso</option>
                  <option value="Resolved">Resolvido</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                Criar Ticket
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>;
}