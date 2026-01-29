import { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { generateOTPSecret } from '../utils/otp';
import { supabase } from '../lib/supabase';

const DEFAULT_ADMIN_USERNAME = 'lucasadmin';
const DEFAULT_ADMIN_PASSWORD = 'Molurus8@';

// Função para garantir que o usuário admin padrão existe
const ensureDefaultAdmin = async (): Promise<void> => {
  try {
    // Verificar se existe o usuário admin padrão (usando ilike para case-insensitive)
    const { data: existingUsers, error: selectError } = await supabase
      .from('UsuariosSistema')
      .select('*')
      .ilike('username', DEFAULT_ADMIN_USERNAME)
      .limit(1);

    if (selectError) {
      console.error('Erro ao verificar usuário admin padrão:', selectError);
      return;
    }

    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    if (!existingUser) {
      // Criar usuário admin padrão se não existir
      // Tentar sem especificar o ID, deixando o Supabase gerar (mais compatível)
      const defaultAdminWithoutId = {
        username: DEFAULT_ADMIN_USERNAME,
        password: DEFAULT_ADMIN_PASSWORD,
        otpSecret: generateOTPSecret(),
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      console.log('Criando usuário admin padrão no useAuth:', DEFAULT_ADMIN_USERNAME);
      const { data: insertedData, error: insertError } = await supabase
        .from('UsuariosSistema')
        .insert([defaultAdminWithoutId])
        .select();

      if (insertError) {
        console.error('Erro ao criar usuário admin padrão:', insertError);
        console.error('Detalhes do erro:', JSON.stringify(insertError, null, 2));
      } else if (insertedData && insertedData.length > 0) {
        console.log('Usuário admin padrão criado com sucesso:', DEFAULT_ADMIN_USERNAME);
      }
    } else if (existingUser.role !== 'admin') {
      // Garantir que o usuário padrão tem role admin
      const { error: updateError } = await supabase
        .from('UsuariosSistema')
        .update({ role: 'admin', password: DEFAULT_ADMIN_PASSWORD })
        .ilike('username', DEFAULT_ADMIN_USERNAME);

      if (updateError) {
        console.error('Erro ao atualizar role do usuário admin padrão:', updateError);
      } else {
        console.log('Role de admin corrigida para:', DEFAULT_ADMIN_USERNAME);
      }
    }
  } catch (error) {
    console.error('Erro ao garantir usuário admin padrão:', error);
  }
};

// Função auxiliar para buscar usuário do Supabase
const getUserByUsernameFromStorage = async (username: string): Promise<User | undefined> => {
  try {
    const { data: userData, error } = await supabase
      .from('UsuariosSistema')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (!userData) {
      // Nenhum usuário encontrado
      console.log('getUserByUsernameFromStorage: Usuário não encontrado. Buscando:', username);
      return undefined;
    }

    if (userData) {
      const user: User = {
        id: userData.id,
        username: userData.username,
        password: userData.password,
        otpSecret: userData.otpSecret,
        role: userData.role as UserRole,
        createdAt: new Date(userData.createdAt || userData.created_at || new Date()),
      };

      console.log('getUserByUsernameFromStorage: Usuário encontrado:', user.username);
      console.log('getUserByUsernameFromStorage: otpSecret presente?', !!user.otpSecret);
      if (!user.otpSecret) {
        console.error('getUserByUsernameFromStorage: ATENÇÃO - Usuário não tem otpSecret!');
      }
      return user;
    }

    return undefined;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return undefined;
  }
};

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  username: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userRole: null,
    username: null,
  });

  // Função para verificar autenticação
  const checkAuth = () => {
    const authToken = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('userRole') as UserRole | null;
    
    setAuthState({
      isAuthenticated: !!authToken,
      isLoading: false,
      userRole: role,
      username: username,
    });
  };

  useEffect(() => {
    // Garantir que o usuário admin padrão existe
    ensureDefaultAdmin();
    
    // Verificar se já existe uma sessão autenticada
    checkAuth();

    // Listener para mudanças no localStorage (para sincronizar entre abas/componentes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        checkAuth();
      }
    };

    // Listener para evento customizado de mudança de autenticação
    const handleAuthStateChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Autenticação usando usuários cadastrados (sem MFA)
    try {
      // Validação básica
      if (!username || !password) {
        console.log('Login: Validação básica falhou - username ou password vazio');
        return false;
      }

      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();
      
      // Garantir que o usuário admin padrão existe antes de tentar login
      await ensureDefaultAdmin();
      
      console.log('Login: Tentando autenticar usuário:', trimmedUsername);

      // Buscar usuário do Supabase
      const user = await getUserByUsernameFromStorage(trimmedUsername);
      
      if (!user) {
        console.log('Login: Usuário não encontrado:', trimmedUsername);
        return false;
      }

      console.log('Login: Usuário encontrado:', user.username);
      console.log('Login: Comparando senhas - armazenada:', user.password, 'fornecida:', trimmedPassword);
      console.log('Login: Senhas iguais?', user.password === trimmedPassword);

      // Validar credenciais (senha)
      if (
        user.password === trimmedPassword &&
        user.username.toLowerCase() === trimmedUsername
      ) {
        console.log('Login: Autenticação bem-sucedida!');
        // Autenticação bem-sucedida
        const authToken = `token_${Date.now()}`;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('username', user.username);
        localStorage.setItem('userRole', user.role);

        // Forçar atualização do estado
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          userRole: user.role,
          username: user.username,
        });

        // Disparar evento customizado para sincronizar outros componentes
        window.dispatchEvent(new Event('authStateChanged'));

        return true;
      }

      console.log('Login: Credenciais inválidas - senha não confere');
      return false;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAdmin');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      userRole: null,
      username: null,
    });
    // Disparar evento customizado para sincronizar outros componentes
    window.dispatchEvent(new Event('authStateChanged'));
  };

  return {
    ...authState,
    login,
    logout,
  };
}

