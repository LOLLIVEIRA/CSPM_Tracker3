import React, { useState } from 'react';
import { ShieldCheck, Plus, LogOut } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { ImportButton } from './ImportButton';
import { NewTicketModal } from './NewTicketModal';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Misconfiguration, Resolver } from '../types';
interface HeaderProps {
  resolvers: Resolver[];
  onImport: (data: Misconfiguration[]) => void;
  onCreate: (ticket: Omit<Misconfiguration, 'id' | 'detectedAt' | 'crowdstrikeId' | 'slaDeadline'>) => void;
}
export function Header({
  resolvers,
  onImport,
  onCreate
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const isAdmin = userRole === 'admin';
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  CSPM
                  <span className="text-blue-600 dark:text-blue-400">
                    Tracker
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  MONITOR SLA
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')}`}>
                Dashboard
              </Link>
              <Link to="/misconfigurations" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/misconfigurations')}`}>
                Tickets
              </Link>
              <Link to="/ranking" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/ranking')}`}>
                Ranking
              </Link>
              {isAdmin && (
                <>
                  <Link to="/users" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/users')}`}>
                    Usuários
                  </Link>
                  <Link to="/settings" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/settings')}`}>
                    Configurações
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button onClick={() => setShowNewTicketModal(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Plus size={16} />
                  <span className="hidden sm:inline">Novo Ticket</span>
                </button>
                <ImportButton onImport={onImport} />
              </>
            )}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <DarkModeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
              title="Sair"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <NewTicketModal isOpen={showNewTicketModal} onClose={() => setShowNewTicketModal(false)} onCreate={onCreate} resolvers={resolvers} />
    </>;
}