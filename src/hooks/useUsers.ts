import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { generateOTPSecret } from '../utils/otp';
import { supabase } from '../lib/supabase';

const DEFAULT_ADMIN_USERNAME = 'lucasadmin';
const DEFAULT_ADMIN_PASSWORD = 'Molurus8@';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar usuários do Supabase
  const loadUsers = useCallback(async () => {
    try {
      // Carregar usuários do Supabase
      const { data: usersData, error } = await supabase
        .from('UsuariosSistema')
        .select('*')
        .order('username', { ascending: true });

      if (error) {
        console.error('Erro ao carregar usuários do Supabase:', error);
        setIsLoading(false);
        return;
      }

      let parsedUsers: User[] = [];
      
      if (usersData && usersData.length > 0) {
        parsedUsers = usersData.map((u: any) => ({
          id: u.id,
          username: u.username,
          password: u.password,
          otpSecret: u.otpSecret || generateOTPSecret(),
          role: u.role as UserRole,
          createdAt: new Date(u.createdAt || u.created_at || new Date()),
        }));
      }
      
      // Garantir que o usuário admin padrão sempre existe e tem role admin
      const hasDefaultAdmin = parsedUsers.some((u: User) => u.username === DEFAULT_ADMIN_USERNAME);
      
      if (!hasDefaultAdmin) {
        // Criar usuário admin padrão no Supabase se não existir
        // Tentar sem especificar o ID, deixando o Supabase gerar (mais compatível)
        const defaultAdminWithoutId = {
          username: DEFAULT_ADMIN_USERNAME,
          password: DEFAULT_ADMIN_PASSWORD,
          otpSecret: generateOTPSecret(),
          role: 'admin',
          createdAt: new Date().toISOString(),
        };

        console.log('Criando usuário admin padrão:', DEFAULT_ADMIN_USERNAME);
        const { data: insertedData, error: insertError } = await supabase
          .from('UsuariosSistema')
          .insert([defaultAdminWithoutId])
          .select();

        if (insertError) {
          console.error('Erro ao criar usuário admin padrão no Supabase:', insertError);
          console.error('Detalhes do erro:', JSON.stringify(insertError, null, 2));
        } else if (insertedData && insertedData.length > 0) {
          parsedUsers.push({
            id: insertedData[0].id,
            username: insertedData[0].username,
            password: insertedData[0].password,
            otpSecret: insertedData[0].otpSecret,
            role: insertedData[0].role as UserRole,
            createdAt: new Date(insertedData[0].createdAt || insertedData[0].created_at || new Date()),
          });
          console.log('Usuário admin padrão criado com sucesso:', DEFAULT_ADMIN_USERNAME);
        }
      } else {
        // Garantir que o admin padrão sempre tem role admin e senha correta
        const defaultAdminUser = parsedUsers.find(u => u.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase());
        if (defaultAdminUser) {
          const needsUpdate = defaultAdminUser.role !== 'admin' || defaultAdminUser.password !== DEFAULT_ADMIN_PASSWORD;
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('UsuariosSistema')
              .update({ 
                role: 'admin',
                password: DEFAULT_ADMIN_PASSWORD 
              })
              .ilike('username', DEFAULT_ADMIN_USERNAME);

            if (updateError) {
              console.error('Erro ao atualizar usuário admin padrão no Supabase:', updateError);
            } else {
              parsedUsers = parsedUsers.map((u: User) => {
                if (u.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase()) {
                  return {
                    ...u,
                    role: 'admin' as UserRole,
                    password: DEFAULT_ADMIN_PASSWORD,
                  };
                }
                return u;
              });
            }
          }
        }
      }
      
      setUsers(parsedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar usuários do Supabase na inicialização
  useEffect(() => {
    loadUsers();

    // Listener para evento customizado de mudança de usuários
    const handleUsersChange = () => {
      loadUsers();
    };

    window.addEventListener('usersChanged', handleUsersChange);

    return () => {
      window.removeEventListener('usersChanged', handleUsersChange);
    };
  }, [loadUsers]);

  // Recarregar usuários do Supabase
  const reloadUsers = async () => {
    await loadUsers();
  };

  // Adicionar novo usuário
  const addUser = async (username: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      if (!username || !username.trim()) {
        console.error('Nome de usuário inválido');
        return false;
      }

      if (!password || password.length < 6) {
        console.error('Senha inválida');
        return false;
      }

      // Validar se o usuário já existe
      const trimmedUsername = username.trim().toLowerCase();
      const existingUser = users.find(u => u.username.toLowerCase() === trimmedUsername);
      if (existingUser) {
        console.error('Usuário já existe:', trimmedUsername);
        return false;
      }

      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        username: username.trim(),
        password,
        otpSecret: generateOTPSecret(),
        role,
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('UsuariosSistema')
        .insert([newUser]);

      if (error) {
        console.error('Erro ao adicionar usuário no Supabase:', error);
        return false;
      }

      // Recarregar usuários do Supabase
      await reloadUsers();
      
      console.log('Usuário criado com sucesso:', newUser.username);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      return false;
    }
  };

  // Remover usuário
  const removeUser = async (userId: string): Promise<boolean> => {
    try {
      const userToRemove = users.find(u => u.id === userId);
      
      // NUNCA permitir remover o usuário admin padrão
      if (userToRemove?.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase()) {
        console.warn('Não é possível remover o usuário admin padrão:', DEFAULT_ADMIN_USERNAME);
        return false;
      }
      
      // Não permitir remover o último admin
      const remainingAdmins = users.filter(u => u.id !== userId && u.role === 'admin');
      
      if (userToRemove?.role === 'admin' && remainingAdmins.length === 0) {
        return false; // Não pode remover o último admin
      }

      const { error } = await supabase
        .from('UsuariosSistema')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Erro ao remover usuário do Supabase:', error);
        return false;
      }

      // Recarregar usuários do Supabase
      await reloadUsers();
      return true;
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      return false;
    }
  };

  // Atualizar usuário
  const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<boolean> => {
    try {
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return false;

      const user = users[userIndex];
      
      // NUNCA permitir alterar o role do usuário admin padrão para viewer
      if (user.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase() && updates.role === 'viewer') {
        console.warn('Não é possível alterar o role do usuário admin padrão para viewer:', DEFAULT_ADMIN_USERNAME);
        return false;
      }
      
      // Não permitir alterar username do admin padrão
      if (user.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase() && updates.username && updates.username.toLowerCase() !== DEFAULT_ADMIN_USERNAME.toLowerCase()) {
        console.warn('Não é possível alterar o username do usuário admin padrão:', DEFAULT_ADMIN_USERNAME);
        return false;
      }

      // Se estiver mudando o role para viewer, verificar se não é o último admin
      if (updates.role === 'viewer') {
        if (user.role === 'admin') {
          const remainingAdmins = users.filter(u => u.id !== userId && u.role === 'admin');
          if (remainingAdmins.length === 0) {
            return false; // Não pode remover o último admin
          }
        }
      }

      // Preparar dados para atualização no Supabase
      const updateData: any = {};
      if (updates.username) updateData.username = updates.username;
      if (updates.role) updateData.role = updates.role;
      if (updates.password) updateData.password = updates.password;
      if (updates.otpSecret) updateData.otpSecret = updates.otpSecret;

      const { error } = await supabase
        .from('UsuariosSistema')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar usuário no Supabase:', error);
        return false;
      }

      // Recarregar usuários do Supabase
      await reloadUsers();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  };

  // Resetar senha de um usuário
  const resetPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      if (!newPassword || newPassword.length < 6) {
        console.error('Senha inválida. Deve ter pelo menos 6 caracteres');
        return false;
      }

      const user = users.find(u => u.id === userId);
      if (!user) {
        console.error('Usuário não encontrado');
        return false;
      }

      const { error } = await supabase
        .from('UsuariosSistema')
        .update({ password: newPassword })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao resetar senha no Supabase:', error);
        return false;
      }

      // Recarregar usuários do Supabase
      await reloadUsers();
      
      console.log('Senha resetada com sucesso para o usuário:', user.username);
      return true;
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return false;
    }
  };

  // Buscar usuário por username
  const getUserByUsername = (username: string): User | undefined => {
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  };

  return {
    users,
    isLoading,
    addUser,
    removeUser,
    updateUser,
    resetPassword,
    getUserByUsername,
  };
}



