import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DarkModeToggle } from '../components/DarkModeToggle';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validações básicas
    if (!username.trim()) {
      setError('Por favor, insira o nome de usuário.');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Por favor, insira a senha.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(username, password);

      if (success) {
        // Login bem-sucedido - o useEffect vai redirecionar automaticamente
        navigate('/', { replace: true });
      } else {
        setError('Credenciais inválidas. Verifique seu usuário e senha.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao realizar login. Por favor, tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors duration-300">
      {/* Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            CSPM
            <span className="text-blue-600 dark:text-blue-400"> Tracker</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
            MONITOR SLA
          </p>
        </div>

        {/* Formulário de Login */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
            Acesso ao Sistema
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Usuário */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Sistema de Monitoramento CSPM
        </p>
      </div>
    </div>
  );
}

