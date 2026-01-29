import { Buffer } from 'buffer';
import { authenticator } from 'otplib';

// Polyfill Buffer para navegador (necessário para otplib funcionar no navegador)
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

// Garantir que Buffer está disponível globalmente
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  (globalThis as any).Buffer = Buffer;
}

// Configurar o authenticator com as opções padrão TOTP
authenticator.options = {
  window: [1, 1], // Permitir 1 período antes e depois (janela de 60 segundos)
  step: 30, // Código muda a cada 30 segundos
};

/**
 * Gera um secret único para TOTP (compatível com navegador)
 * @returns string - Secret em formato base32
 */
export function generateOTPSecret(): string {
  try {
    // Usar a API Web Crypto do navegador
    const array = new Uint8Array(20); // 20 bytes = 160 bits (tamanho padrão para TOTP)
    crypto.getRandomValues(array);
    
    // Converter para base32
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < array.length; i++) {
      value = (value << 8) | array[i];
      bits += 8;
      
      while (bits >= 5) {
        secret += base32Chars[(value >>> (bits - 5)) & 0x1f];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      secret += base32Chars[(value << (5 - bits)) & 0x1f];
    }
    
    return secret;
  } catch (error) {
    console.error('Erro ao gerar secret usando Web Crypto, usando fallback:', error);
    // Fallback: usar Math.random() como último recurso
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
}

/**
 * Gera um código OTP baseado no secret e no tempo atual
 * @param secret - Secret do usuário
 * @returns string - Código OTP de 6 dígitos
 */
export function generateOTPCode(secret: string): string {
  return authenticator.generate(secret);
}

/**
 * Valida um código OTP
 * @param token - Código OTP fornecido pelo usuário
 * @param secret - Secret do usuário
 * @returns boolean - true se o código for válido
 */
export function verifyOTPCode(token: string, secret: string): boolean {
  try {
    if (!secret || !token) {
      console.error('verifyOTPCode: Secret ou token vazio. Secret:', !!secret, 'Token:', !!token);
      return false;
    }

    // Limpar o token (remover espaços e garantir que é numérico)
    const cleanToken = token.trim();
    
    if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      console.error('verifyOTPCode: Token inválido. Deve ter 6 dígitos numéricos. Recebido:', cleanToken);
      return false;
    }
    
    const result = authenticator.verify({ token: cleanToken, secret });
    console.log('verifyOTPCode: Validação OTP - Token:', cleanToken, 'Resultado:', result, 'Secret (primeiros 10):', secret.substring(0, 10) + '...');
    
    if (!result) {
      // Tentar gerar um código para debug (não exibir em produção normalmente)
      try {
        const generatedCode = authenticator.generate(secret);
        console.log('verifyOTPCode: Código gerado pelo sistema neste momento:', generatedCode);
        console.log('verifyOTPCode: Código fornecido pelo usuário:', cleanToken);
        console.log('verifyOTPCode: Diferença:', Math.abs(parseInt(generatedCode) - parseInt(cleanToken)));
      } catch (genError) {
        console.error('verifyOTPCode: Erro ao gerar código para debug:', genError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Erro ao verificar OTP:', error);
    return false;
  }
}

/**
 * Gera uma URL otpauth para QR code (Google Authenticator, Authy, etc)
 * @param secret - Secret do usuário
 * @param username - Nome do usuário
 * @param issuer - Nome da aplicação/empresa
 * @returns string - URL otpauth
 */
export function generateOTPAuthURL(secret: string, username: string, issuer: string = 'CSPM Tracker'): string {
  return authenticator.keyuri(username, issuer, secret);
}

