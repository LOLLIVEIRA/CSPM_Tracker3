import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Shield, Eye, User as UserIcon, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

export function UsersPage() {
  const { users, addUser, removeUser, updateUser, isLoading } = useUsers();
  const { userRole } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer' as UserRole,
  });
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    role: '',
  });

  // Verificar se o usuário atual é admin
  const isAdmin = userRole === 'admin';

  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
      role: '',
    };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
      isValid = false;
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
      isValid = false;
    } else if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase().trim())) {
      newErrors.username = 'Nome de usuário já existe';
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const success = await addUser(
        formData.username.trim(),
        formData.password,
        formData.role
      );

      if (success) {
        setFormData({
          username: '',
          password: '',
          role: 'viewer',
        });
        setShowForm(false);
        setErrors({
          username: '',
          password: '',
          role: '',
        });
      } else {
        setErrors({
          ...errors,
          username: 'Erro ao criar usuário. Tente novamente.',
        });
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      username: '',
      password: '',
      role: 'viewer',
    });
    setErrors({
      username: '',
      password: '',
      role: '',
    });
  };

  const handleDelete = async (userId: string) => {
    const success = await removeUser(userId);
    if (!success) {
      alert('Não é possível remover o último administrador do sistema.');
    }
    setUserToDelete(null);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const success = await updateUser(userId, { role: newRole });
    if (!success) {
      alert('Não é possível alterar o role. Deve haver pelo menos um administrador no sistema.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Acesso Negado
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Apenas administradores podem gerenciar usuários.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center py-8 text-slate-400">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Gerenciamento de Usuários
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Crie e gerencie usuários do sistema com diferentes níveis de acesso
          </p>
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Usuários do Sistema
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Administradores têm acesso completo. Visualizadores podem apenas ver Dashboard e Tickets.
              </p>
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <UserPlus size={16} />
                Adicionar Usuário
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Add User Form */}
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="mb-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Novo Usuário
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <UserIcon size={16} />
                      Nome de Usuário *
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Ex: joao.silva"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                      errors.username ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Lock size={16} />
                      Senha *
                    </div>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Mínimo 6 caracteres"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                      errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={16} />
                      Tipo de Acesso *
                    </div>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="viewer">Visualizador (Apenas Dashboard e Tickets)</option>
                    <option value="admin">Administrador (Acesso Completo)</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Visualizadores podem apenas visualizar. Administradores têm acesso completo ao sistema.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Criar Usuário
                </button>
              </div>
            </motion.form>
          )}

          {/* Users List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Usuários cadastrados ({users.length})
            </h3>

            {users.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhum usuário cadastrado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 dark:text-white font-medium">
                            {user.username}
                          </p>
                          {user.role === 'admin' ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1">
                              <Shield size={12} />
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded flex items-center gap-1">
                              <Eye size={12} />
                              Visualizador
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                      >
                        <option value="viewer">Visualizador</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <button
                        onClick={() => setUserToDelete(user.id)}
                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1
                            ? 'Não é possível remover o último administrador'
                            : 'Remover usuário'
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (userToDelete) {
            await handleDelete(userToDelete);
          }
        }}
        title="Remover usuário"
        message="Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}



