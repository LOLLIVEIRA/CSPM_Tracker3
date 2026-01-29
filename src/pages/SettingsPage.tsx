import React, { useState } from 'react';
import { Settings, UserPlus, Trash2, Users, Mail, User as UserIcon, Shield, Lock, Eye, EyeOff, CheckCircle, Calendar, KeyRound, RotateCcw, Edit2, AlertTriangle, Trash, QrCode, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Resolver, UserRole } from '../types';
import { useUsers } from '../hooks/useUsers';
import { generateOTPAuthURL } from '../utils/otp';
interface SettingsPageProps {
  resolvers: Resolver[];
  onAddResolver: (resolver: Resolver) => Promise<void>;
  onRemoveResolver: (email: string) => Promise<void>;
  onRemoveAllResolvers: () => Promise<void>;
  onUpdateResolver: (oldEmail: string, updatedResolver: Resolver) => Promise<void>;
  onDeleteAllTickets: () => void;
  allDataCount: number;
}
export function SettingsPage({
  resolvers,
  onAddResolver,
  onRemoveResolver,
  onRemoveAllResolvers,
  onUpdateResolver,
  onDeleteAllTickets,
  allDataCount
}: SettingsPageProps) {
  const { addUser, users, removeUser, resetPassword, updateUser } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    role: 'viewer' as UserRole
  });
  const [resolverToDelete, setResolverToDelete] = useState<Resolver | null>(null);
  const [resolverToEdit, setResolverToEdit] = useState<Resolver | null>(null);
  const [editResolverData, setEditResolverData] = useState({ name: '', email: '' });
  const [editResolverErrors, setEditResolverErrors] = useState({ name: '', email: '' });
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showDeleteAllTicketsDialog, setShowDeleteAllTicketsDialog] = useState(false);
  const [showRemoveAllResolversDialog, setShowRemoveAllResolversDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState({ username: '', role: 'viewer' as UserRole });
  const [editUserErrors, setEditUserErrors] = useState({ username: '', role: '' });
  const [userToShowTOTP, setUserToShowTOTP] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedURL, setCopiedURL] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: ''
  });
  const [userErrors, setUserErrors] = useState({
    username: '',
    password: '',
    role: ''
  });
  const [userSuccessMessage, setUserSuccessMessage] = useState('');
  const validateForm = () => {
    const newErrors = {
      name: '',
      email: ''
    };
    let isValid = true;
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
      isValid = false;
    } else if (resolvers.some(r => r.email === formData.email)) {
      newErrors.email = 'E-mail já cadastrado';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onAddResolver({
        name: formData.name.trim(),
        email: formData.email.trim()
      });
      setFormData({
        name: '',
        email: ''
      });
      setShowForm(false);
      setErrors({
        name: '',
        email: ''
      });
    }
  };
  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      name: '',
      email: ''
    });
    setErrors({
      name: '',
      email: ''
    });
  };

  const handleEditResolver = (resolver: Resolver) => {
    setResolverToEdit(resolver);
    setEditResolverData({
      name: resolver.name,
      email: resolver.email
    });
    setEditResolverErrors({ name: '', email: '' });
  };

  const validateEditResolverForm = () => {
    const newErrors = {
      name: '',
      email: ''
    };
    let isValid = true;

    if (!editResolverData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }

    if (!editResolverData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editResolverData.email)) {
      newErrors.email = 'E-mail inválido';
      isValid = false;
    } else if (resolverToEdit && editResolverData.email !== resolverToEdit.email && resolvers.some(r => r.email.toLowerCase() === editResolverData.email.toLowerCase())) {
      newErrors.email = 'E-mail já cadastrado';
      isValid = false;
    }

    setEditResolverErrors(newErrors);
    return isValid;
  };

  const handleSaveEditResolver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolverToEdit) return;

    if (validateEditResolverForm()) {
      await onUpdateResolver(resolverToEdit.email, {
        name: editResolverData.name.trim(),
        email: editResolverData.email.trim()
      });
      setResolverToEdit(null);
      setEditResolverData({ name: '', email: '' });
      setEditResolverErrors({ name: '', email: '' });
    }
  };

  const handleCancelEditResolver = () => {
    setResolverToEdit(null);
    setEditResolverData({ name: '', email: '' });
    setEditResolverErrors({ name: '', email: '' });
  };

  const validateUserForm = () => {
    const newErrors = {
      username: '',
      password: '',
      role: ''
    };
    let isValid = true;

    if (!userFormData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
      isValid = false;
    } else if (userFormData.username.trim().length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
      isValid = false;
    }
    // Validação de duplicidade será feita em addUser (verifica no localStorage atualizado)

    if (!userFormData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (userFormData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    setUserErrors(newErrors);
    return isValid;
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (validateUserForm()) {
      try {
        const success = await addUser(
          userFormData.username.trim(),
          userFormData.password,
          userFormData.role
        );

        if (success) {
          setUserSuccessMessage('Usuário criado com sucesso!');
          setUserFormData({
            username: '',
            password: '',
            role: 'viewer'
          });
          setUserErrors({
            username: '',
            password: '',
            role: ''
          });
          // Fechar formulário após 1 segundo
          setTimeout(() => {
            setShowUserForm(false);
            setUserSuccessMessage('');
          }, 1500);
        } else {
          setUserErrors({
            username: 'Nome de usuário já existe. Por favor, escolha outro.',
            password: '',
            role: ''
          });
          setUserSuccessMessage('');
        }
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        setUserErrors({
          username: 'Erro ao criar usuário. Tente novamente.',
          password: '',
          role: ''
        });
        setUserSuccessMessage('');
      }
    }
  };

  const handleUserCancel = () => {
    setShowUserForm(false);
    setUserFormData({
      username: '',
      password: '',
      role: 'viewer'
    });
    setUserErrors({
      username: '',
      password: '',
      role: ''
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await removeUser(userId);
    if (!success) {
      alert('Não é possível remover o último administrador do sistema.');
    }
    setUserToDelete(null);
  };

  const handleEditUser = (user: typeof users[0]) => {
    setUserToEdit(user.id);
    setEditUserData({
      username: user.username,
      role: user.role
    });
    setEditUserErrors({ username: '', role: '' });
  };

  const validateEditUserForm = () => {
    const newErrors = {
      username: '',
      role: ''
    };
    let isValid = true;

    if (!editUserData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
      isValid = false;
    } else if (editUserData.username.trim().length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
      isValid = false;
    } else if (userToEdit && users.find(u => u.id === userToEdit)?.username !== editUserData.username.trim() && users.some(u => u.username.toLowerCase() === editUserData.username.trim().toLowerCase())) {
      newErrors.username = 'Nome de usuário já existe';
      isValid = false;
    }

    setEditUserErrors(newErrors);
    return isValid;
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (validateEditUserForm()) {
      const success = await updateUser(userToEdit, {
        username: editUserData.username.trim(),
        role: editUserData.role
      });
      
      if (success) {
        setUserToEdit(null);
        setEditUserData({ username: '', role: 'viewer' });
        setEditUserErrors({ username: '', role: '' });
        setUserSuccessMessage('Usuário atualizado com sucesso!');
        setTimeout(() => setUserSuccessMessage(''), 3000);
      } else {
        alert('Não é possível alterar o role. Deve haver pelo menos um administrador no sistema.');
      }
    }
  };

  const handleCancelEditUser = () => {
    setUserToEdit(null);
    setEditUserData({ username: '', role: 'viewer' });
    setEditUserErrors({ username: '', role: '' });
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedURL(true);
    setTimeout(() => setCopiedURL(false), 2000);
  };

  const handleResetPassword = async () => {
    if (!userToResetPassword) return;
    
    if (!newPassword || newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const user = users.find(u => u.id === userToResetPassword);
    const username = user?.username || 'usuário';

    const success = await resetPassword(userToResetPassword, newPassword);
    if (success) {
      setShowPasswordResetModal(false);
      setUserToResetPassword(null);
      setNewPassword('');
      setUserSuccessMessage(`Senha resetada com sucesso para o usuário ${username}!`);
      setTimeout(() => setUserSuccessMessage(''), 3000);
    } else {
      alert('Erro ao resetar senha. Tente novamente.');
    }
  };
  return <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Configurações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie usuários, resolvedores e preferências do sistema
          </p>
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Usuários do Sistema
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Crie novos usuários com privilégios de administrador ou usuário padrão. O código OTP será gerado automaticamente para cada usuário.
              </p>
            </div>

            {!showUserForm && (
              <button
                onClick={() => setShowUserForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <UserPlus size={16} />
                Criar Usuário
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Add User Form */}
          {showUserForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleUserSubmit}
              className="mb-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Novo Usuário
              </h3>

              {userSuccessMessage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle size={16} />
                  <span>{userSuccessMessage}</span>
                </div>
              )}

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
                    value={userFormData.username}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, username: e.target.value })
                    }
                    placeholder="Ex: joao.silva"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                      userErrors.username
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-600'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`}
                  />
                  {userErrors.username && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {userErrors.username}
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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userFormData.password}
                      onChange={(e) =>
                        setUserFormData({ ...userFormData, password: e.target.value })
                      }
                      placeholder="Mínimo 6 caracteres"
                      className={`w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border ${
                        userErrors.password
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {userErrors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {userErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={16} />
                      Privilégio *
                    </div>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserFormData({ ...userFormData, role: 'admin' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        userFormData.role === 'admin'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Shield
                          className={`w-5 h-5 ${
                            userFormData.role === 'admin'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            userFormData.role === 'admin'
                              ? 'text-blue-900 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Administrador
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-left">
                        Gerenciar a plataforma
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserFormData({ ...userFormData, role: 'viewer' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        userFormData.role === 'viewer'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Users
                          className={`w-5 h-5 ${
                            userFormData.role === 'viewer'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            userFormData.role === 'viewer'
                              ? 'text-blue-900 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Usuário Padrão
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-left">
                        Resolvedor
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleUserCancel}
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
                <UserIcon size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhum usuário cadastrado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user, index) => {
                  const isEditing = userToEdit === user.id;
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      {isEditing ? (
                        // Edit Form
                        <form onSubmit={handleSaveEditUser} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              <div className="flex items-center gap-2">
                                <UserIcon size={16} />
                                Nome de Usuário *
                              </div>
                            </label>
                            <input
                              type="text"
                              value={editUserData.username}
                              onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                              placeholder="Ex: joao.silva"
                              className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                                editUserErrors.username ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`}
                            />
                            {editUserErrors.username && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {editUserErrors.username}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              <div className="flex items-center gap-2">
                                <Shield size={16} />
                                Privilégio *
                              </div>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setEditUserData({ ...editUserData, role: 'admin' })}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  editUserData.role === 'admin'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Shield
                                    className={`w-5 h-5 ${
                                      editUserData.role === 'admin'
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-400'
                                    }`}
                                  />
                                  <span
                                    className={`font-medium ${
                                      editUserData.role === 'admin'
                                        ? 'text-blue-900 dark:text-blue-300'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    Administrador
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-left">
                                  Gerenciar a plataforma
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditUserData({ ...editUserData, role: 'viewer' })}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  editUserData.role === 'viewer'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <UserIcon
                                    className={`w-5 h-5 ${
                                      editUserData.role === 'viewer'
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-400'
                                    }`}
                                  />
                                  <span
                                    className={`font-medium ${
                                      editUserData.role === 'viewer'
                                        ? 'text-blue-900 dark:text-blue-300'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    Usuário Padrão
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-left">
                                  Resolvedor
                                </p>
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={handleCancelEditUser}
                              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                              Salvar
                            </button>
                          </div>
                        </form>
                      ) : (
                        // Display Mode
                        <>
                          <div className="flex items-center justify-between">
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
                                      Administrador
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded flex items-center gap-1">
                                      <UserIcon size={12} />
                                      Usuário Padrão
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                  <Calendar size={12} />
                                  Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Editar usuário"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setUserToShowTOTP(user.id)}
                                className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Ver token TOTP / QR Code"
                              >
                                <QrCode size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setUserToResetPassword(user.id);
                                  setShowPasswordResetModal(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Resetar senha"
                              >
                                <RotateCcw size={18} />
                              </button>
                              <button
                                onClick={() => setUserToDelete(user.id)}
                                disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1
                                    ? 'Não é possível remover o último administrador'
                                    : 'Excluir usuário'
                                }
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete All Tickets Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Gerenciamento de Tickets
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ações administrativas para gerenciar todos os tickets do sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                  Excluir Todos os Tickets
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  Esta ação irá excluir permanentemente todos os {allDataCount} tickets do sistema. Esta ação não pode ser desfeita.
                </p>
                <button
                  onClick={() => setShowDeleteAllTicketsDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Trash size={16} />
                  Excluir Todos os Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolvers Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Resolvedores
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Adicione ou remova membros da equipe que podem ser atribuídos a
                tickets
              </p>
            </div>

            {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <UserPlus size={16} />
                Adicionar
              </button>}
          </div>
        </div>

        <div className="p-6">
          {/* Add Resolver Form */}
          {showForm && <motion.form initial={{
          opacity: 0,
          height: 0
        }} animate={{
          opacity: 1,
          height: 'auto'
        }} exit={{
          opacity: 0,
          height: 0
        }} onSubmit={handleSubmit} className="mb-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Novo Resolvedor
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <UserIcon size={16} />
                      Nome *
                    </div>
                  </label>
                  <input type="text" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Ex: João Silva" className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`} />
                  {errors.name && <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.name}
                    </p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      E-mail *
                    </div>
                  </label>
                  <input type="email" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} placeholder="Ex: joao.silva@empresa.com" className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`} />
                  {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.email}
                    </p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                  Salvar
                </button>
              </div>
            </motion.form>}

          {/* Resolvers List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Resolvedores cadastrados ({resolvers.length})
              </h3>
              {resolvers.length > 0 && (
                <button
                  onClick={() => setShowRemoveAllResolversDialog(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash size={14} />
                  Remover Todos
                </button>
              )}
            </div>

            {resolvers.length === 0 ? <div className="text-center py-8 text-slate-400">
                <Users size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhum resolvedor cadastrado ainda</p>
              </div> : <div className="space-y-2">
                {resolvers.map((resolver, index) => {
                  const isEditing = resolverToEdit?.email === resolver.email;
                  return (
                    <motion.div 
                      key={resolver.email} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      {isEditing ? (
                        // Edit Form
                        <form onSubmit={handleSaveEditResolver} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              <div className="flex items-center gap-2">
                                <UserIcon size={16} />
                                Nome *
                              </div>
                            </label>
                            <input
                              type="text"
                              value={editResolverData.name}
                              onChange={(e) => setEditResolverData({ ...editResolverData, name: e.target.value })}
                              placeholder="Ex: João Silva"
                              className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                                editResolverErrors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`}
                            />
                            {editResolverErrors.name && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {editResolverErrors.name}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              <div className="flex items-center gap-2">
                                <Mail size={16} />
                                E-mail *
                              </div>
                            </label>
                            <input
                              type="email"
                              value={editResolverData.email}
                              onChange={(e) => setEditResolverData({ ...editResolverData, email: e.target.value })}
                              placeholder="Ex: joao.silva@empresa.com"
                              className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${
                                editResolverErrors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white`}
                            />
                            {editResolverErrors.email && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {editResolverErrors.email}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={handleCancelEditResolver}
                              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                              Salvar
                            </button>
                          </div>
                        </form>
                      ) : (
                        // Display Mode
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                              {resolver.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-medium">
                                {resolver.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Mail size={12} />
                                {resolver.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditResolver(resolver)}
                              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Editar resolvedor"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => setResolverToDelete(resolver)}
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remover resolvedor"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Resolver */}
      <ConfirmationDialog 
        isOpen={!!resolverToDelete} 
        onClose={() => setResolverToDelete(null)} 
        onConfirm={async () => {
          if (resolverToDelete) {
            await onRemoveResolver(resolverToDelete.email);
            setResolverToDelete(null);
          }
        }} 
        title="Remover resolvedor" 
        message={`Tem certeza que deseja remover "${resolverToDelete?.name}"? Esta ação não pode ser desfeita e o resolvedor será desatribuído de todos os tickets.`} 
        confirmText="Remover" 
        cancelText="Cancelar" 
        variant="danger" 
      />

      {/* Confirmation Dialog for User Deletion */}
      <ConfirmationDialog 
        isOpen={!!userToDelete} 
        onClose={() => setUserToDelete(null)} 
        onConfirm={() => {
          if (userToDelete) {
            handleDeleteUser(userToDelete);
          }
        }} 
        title="Excluir usuário" 
        message={`Tem certeza que deseja excluir o usuário "${users.find(u => u.id === userToDelete)?.username}"? Esta ação não pode ser desfeita.`} 
        confirmText="Excluir" 
        cancelText="Cancelar" 
        variant="danger" 
      />

      {/* Delete All Tickets Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={showDeleteAllTicketsDialog} 
        onClose={() => setShowDeleteAllTicketsDialog(false)} 
        onConfirm={() => {
          onDeleteAllTickets();
          setShowDeleteAllTicketsDialog(false);
        }} 
        title="Excluir Todos os Tickets" 
        message={`Tem certeza absoluta que deseja excluir TODOS os ${allDataCount} tickets do sistema? Esta ação é IRREVERSÍVEL e não pode ser desfeita.`} 
        confirmText="Sim, Excluir Todos" 
        cancelText="Cancelar" 
        variant="danger" 
      />

      {/* Remove All Resolvers Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={showRemoveAllResolversDialog} 
        onClose={() => setShowRemoveAllResolversDialog(false)} 
        onConfirm={async () => {
          await onRemoveAllResolvers();
          setShowRemoveAllResolversDialog(false);
        }} 
        title="Remover Todos os Resolvedores" 
        message={`Tem certeza absoluta que deseja remover TODOS os ${resolvers.length} resolvedores do sistema? Esta ação irá desatribuir todos os resolvedores de todos os tickets. Esta ação não pode ser desfeita.`} 
        confirmText="Sim, Remover Todos" 
        cancelText="Cancelar" 
        variant="danger" 
      />

      {/* TOTP Token Modal */}
      {userToShowTOTP && (() => {
        const user = users.find(u => u.id === userToShowTOTP);
        if (!user) return null;
        const totpURL = generateOTPAuthURL(user.otpSecret, user.username, 'CSPM Tracker');
        const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(totpURL)}`;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-500" />
                  Token TOTP - {user.username}
                </h3>
                <button
                  onClick={() => {
                    setUserToShowTOTP(null);
                    setCopiedSecret(false);
                    setCopiedURL(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Escaneie este QR Code com seu aplicativo de autenticação:
                  </p>
                  <div className="bg-white p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                    <img
                      src={qrCodeURL}
                      alt="QR Code TOTP"
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                    Use Google Authenticator, Authy, Microsoft Authenticator ou outro app compatível
                  </p>
                </div>

                {/* Secret Key */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Chave Secreta (para entrada manual):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={user.otpSecret}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => handleCopySecret(user.otpSecret)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      {copiedSecret ? (
                        <>
                          <CheckCircle size={16} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* OTP Auth URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    URL otpauth (para configuração manual):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={totpURL}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-xs break-all"
                    />
                    <button
                      onClick={() => handleCopyURL(totpURL)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                      {copiedURL ? (
                        <>
                          <CheckCircle size={16} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Instruções:
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>Abra seu aplicativo de autenticação (Google Authenticator, Authy, etc.)</li>
                    <li>Escaneie o QR Code acima ou digite a chave secreta manualmente</li>
                    <li>O aplicativo gerará códigos de 6 dígitos que mudam a cada 30 segundos</li>
                    <li>Use esses códigos para fazer login no sistema</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setUserToShowTOTP(null);
                    setCopiedSecret(false);
                    setCopiedURL(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Password Reset Modal */}
      {showPasswordResetModal && userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-500" />
              Resetar Senha
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Digite a nova senha para o usuário <strong className="text-slate-900 dark:text-white">{users.find(u => u.id === userToResetPassword)?.username}</strong>:
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setUserToResetPassword(null);
                  setNewPassword('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Resetar Senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>;
}