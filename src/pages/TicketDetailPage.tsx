import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Shield, Server, User, Edit2, Save, Trash2 } from 'lucide-react';
import { Misconfiguration, Status, Resolver } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { ProviderBadge } from '../components/ProviderBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
interface TicketDetailPageProps {
  data: Misconfiguration[];
  resolvers: Resolver[];
  onUpdate: (id: string, updates: Partial<Misconfiguration>) => void;
  onDelete: (id: string) => void;
}
export function TicketDetailPage({
  data,
  resolvers,
  onUpdate,
  onDelete
}: TicketDetailPageProps) {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const ticket = data.find(t => t.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Misconfiguration>>({});
  if (!ticket) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Ticket não encontrado
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          O ticket solicitado não existe ou foi removido.
        </p>
        <button onClick={() => navigate('/misconfigurations')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Voltar para lista
        </button>
      </div>;
  }
  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({
      status: ticket.status,
      resolver: ticket.resolver,
      resource: ticket.resource
    });
  };
  const handleSave = () => {
    setShowConfirmation(true);
  };
  const confirmSave = () => {
    onUpdate(ticket.id, editedData);
    setIsEditing(false);
    setEditedData({});
  };
  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };
  const confirmDelete = () => {
    if (ticket) {
      onDelete(ticket.id);
      navigate('/misconfigurations');
    }
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
      text: `${days}d ${hours}h restantes`,
      color: 'text-slate-600 dark:text-slate-400'
    };
    return {
      text: `${hours}h restantes`,
      color: 'text-orange-600 dark:text-orange-400 font-bold'
    };
  };
  const timeRemaining = getTimeRemaining(ticket.slaDeadline);
  return <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/misconfigurations')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={20} />
          Voltar
        </button>

        {!isEditing ? <div className="flex gap-3">
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 size={16} />
              Excluir
            </button>
            <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Edit2 size={16} />
              Editar
            </button>
          </div> : <div className="flex gap-3">
            <button onClick={() => {
          setIsEditing(false);
          setEditedData({});
        }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Save size={16} />
              Salvar
            </button>
          </div>}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {ticket.id}
                </h1>
                <SeverityBadge severity={ticket.severity} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                Crowdstrike ID: {ticket.crowdstrikeId}
              </p>
            </div>
            <ProviderBadge provider={ticket.provider} />
          </div>

          <p className="text-lg text-slate-900 dark:text-white">
            {ticket.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Resource - NOW EDITABLE */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              <Server size={16} />
              Recurso
            </div>
            {isEditing ? <input type="text" value={editedData.resource !== undefined ? editedData.resource : ticket.resource} onChange={e => setEditedData({
            ...editedData,
            resource: e.target.value
          })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono text-sm" placeholder="Ex: s3://bucket-name" /> : <p className="text-slate-900 dark:text-white font-mono text-sm bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg">
                {ticket.resource}
              </p>}
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              <Shield size={16} />
              Status
            </div>
            {isEditing ? <select value={editedData.status || ticket.status} onChange={e => setEditedData({
            ...editedData,
            status: e.target.value as Status
          })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
                <option value="Open">Aberto</option>
                <option value="In Progress">Em Progresso</option>
                <option value="Resolved">Resolvido</option>
                <option value="Overdue">Vencido</option>
              </select> : <StatusBadge status={ticket.status} />}
          </div>

          {/* Resolver */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              <User size={16} />
              Resolvedor
            </div>
            {isEditing ? <select value={editedData.resolver !== undefined ? editedData.resolver?.email || '' : ticket.resolver?.email || ''} onChange={e => {
            const selectedResolver = resolvers.find(r => r.email === e.target.value);
            setEditedData({
              ...editedData,
              resolver: selectedResolver || null
            });
          }} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
                <option value="">Não atribuído</option>
                {resolvers.map(resolver => <option key={resolver.email} value={resolver.email}>
                    {resolver.name} ({resolver.email})
                  </option>)}
              </select> : <div>
                {ticket.resolver ? <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                        {ticket.resolver.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-medium">
                          {ticket.resolver.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {ticket.resolver.email}
                        </p>
                      </div>
                    </div>
                  </div> : <span className="text-slate-400 italic">Não atribuído</span>}
              </div>}
          </div>

          {/* SLA Deadline */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              <Clock size={16} />
              Prazo SLA
            </div>
            <div className="space-y-1">
              <p className={`text-sm font-medium ${timeRemaining.color}`}>
                {timeRemaining.text}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ticket.slaDeadline.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Detected At */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              <Calendar size={16} />
              Detectado em
            </div>
            <p className="text-slate-900 dark:text-white">
              {ticket.detectedAt.toLocaleString('pt-BR', {
              dateStyle: 'long',
              timeStyle: 'short'
            })}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Save */}
      <ConfirmationDialog isOpen={showConfirmation} onClose={() => setShowConfirmation(false)} onConfirm={confirmSave} title="Confirmar alterações" message="Tem certeza que deseja salvar as alterações neste ticket?" confirmText="Salvar" cancelText="Cancelar" variant="info" />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        title="Excluir ticket"
        message={`Tem certeza que deseja excluir o ticket "${ticket?.id}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>;
}