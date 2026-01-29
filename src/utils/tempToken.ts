const TEMP_TOKEN_STORAGE_KEY = 'admin_temp_token';
const TEMP_TOKEN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

export interface TempToken {
  token: string;
  expiresAt: number;
  role: 'admin';
}

/**
 * Gera um token temporário para acesso administrativo
 * @returns string - Token temporário gerado
 */
export function generateTempToken(): string {
  // Gerar um token aleatório seguro
  const token = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  const tempToken: TempToken = {
    token,
    expiresAt: Date.now() + TEMP_TOKEN_DURATION,
    role: 'admin',
  };

  // Salvar no localStorage
  localStorage.setItem(TEMP_TOKEN_STORAGE_KEY, JSON.stringify(tempToken));
  
  return token;
}

/**
 * Valida um token temporário
 * @param token - Token a ser validado
 * @returns boolean - true se o token for válido e não expirado
 */
export function validateTempToken(token: string): boolean {
  try {
    // Remover espaços em branco do token
    const trimmedToken = token.trim();
    
    const stored = localStorage.getItem(TEMP_TOKEN_STORAGE_KEY);
    if (!stored) {
      console.error('Nenhum token temporário armazenado');
      return false;
    }

    const tempToken: TempToken = JSON.parse(stored);
    
    // Verificar se o token corresponde (comparação exata)
    if (tempToken.token !== trimmedToken) {
      console.error('Token não corresponde. Esperado:', tempToken.token, 'Recebido:', trimmedToken);
      return false;
    }

    // Verificar se o token não expirou
    if (Date.now() > tempToken.expiresAt) {
      // Remover token expirado
      localStorage.removeItem(TEMP_TOKEN_STORAGE_KEY);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao validar token temporário:', error);
    return false;
  }
}

/**
 * Remove o token temporário (usado após login bem-sucedido)
 */
export function clearTempToken(): void {
  localStorage.removeItem(TEMP_TOKEN_STORAGE_KEY);
}

/**
 * Verifica se existe um token temporário válido armazenado
 * @returns string | null - O token se válido, null caso contrário
 */
export function getValidTempToken(): string | null {
  try {
    const stored = localStorage.getItem(TEMP_TOKEN_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const tempToken: TempToken = JSON.parse(stored);
    
    // Verificar se o token não expirou
    if (Date.now() > tempToken.expiresAt) {
      localStorage.removeItem(TEMP_TOKEN_STORAGE_KEY);
      return null;
    }

    return tempToken.token;
  } catch (error) {
    return null;
  }
}

/**
 * Obtém informações sobre o token temporário (para exibição)
 * @returns { token: string; expiresAt: Date; expiresIn: string } | null
 */
export function getTempTokenInfo(): { token: string; expiresAt: Date; expiresIn: string } | null {
  try {
    const stored = localStorage.getItem(TEMP_TOKEN_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const tempToken: TempToken = JSON.parse(stored);
    
    if (Date.now() > tempToken.expiresAt) {
      localStorage.removeItem(TEMP_TOKEN_STORAGE_KEY);
      return null;
    }

    const expiresAt = new Date(tempToken.expiresAt);
    const expiresInMs = tempToken.expiresAt - Date.now();
    const expiresInMinutes = Math.floor(expiresInMs / (1000 * 60));
    const expiresInHours = Math.floor(expiresInMinutes / 60);
    const expiresIn = expiresInHours > 0 
      ? `${expiresInHours}h ${expiresInMinutes % 60}m`
      : `${expiresInMinutes}m`;

    return {
      token: tempToken.token,
      expiresAt,
      expiresIn,
    };
  } catch (error) {
    return null;
  }
}

