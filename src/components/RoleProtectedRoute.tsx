import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Você não tem permissão para acessar esta página. Apenas usuários com permissões de administrador podem acessar.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



