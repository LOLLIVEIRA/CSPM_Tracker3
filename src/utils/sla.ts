import { Severity } from '../types';

/**
 * SLAs baseados no padrão CVSS (Common Vulnerability Scoring System) do mercado
 * 
 * Padrão de mercado:
 * - CRITICAL (CVSS 9.0-10.0): 4 horas
 * - HIGH (CVSS 7.0-8.9): 24 horas (1 dia)
 * - MEDIUM (CVSS 4.0-6.9): 7 dias
 * - LOW (CVSS 0.1-3.9): 30 dias
 * - INFORMAL: 90 dias
 */
export const SLA_HOURS: Record<Severity, number> = {
  CRITICAL: 4,      // 4 horas - Vulnerabilidades críticas que podem causar comprometimento total
  HIGH: 24,         // 24 horas (1 dia) - Vulnerabilidades de alta severidade
  MEDIUM: 168,      // 168 horas (7 dias) - Vulnerabilidades de severidade média
  LOW: 720,         // 720 horas (30 dias) - Vulnerabilidades de baixa severidade
  INFORMAL: 2160    // 2160 horas (90 dias) - Informações ou vulnerabilidades informais
};

/**
 * Calcula o deadline do SLA baseado na severidade e data de detecção
 * @param severity - Severidade da vulnerabilidade
 * @param detectedAt - Data/hora em que a vulnerabilidade foi detectada
 * @returns Date - Data/hora limite para resolução (deadline)
 */
export function calculateSLADeadline(severity: Severity, detectedAt: Date): Date {
  const slaHours = SLA_HOURS[severity];
  return new Date(detectedAt.getTime() + slaHours * 60 * 60 * 1000);
}

/**
 * Verifica se um ticket está vencido (passou do SLA)
 * @param slaDeadline - Data/hora limite do SLA
 * @param currentTime - Data/hora atual (opcional, usa new Date() se não fornecido)
 * @returns boolean - true se o ticket está vencido
 */
export function isTicketOverdue(slaDeadline: Date, currentTime: Date = new Date()): boolean {
  return currentTime > slaDeadline;
}

/**
 * Calcula quantas horas restam até o SLA expirar
 * @param slaDeadline - Data/hora limite do SLA
 * @param currentTime - Data/hora atual (opcional, usa new Date() se não fornecido)
 * @returns number - Horas restantes (negativo se vencido)
 */
export function getRemainingSLAHours(slaDeadline: Date, currentTime: Date = new Date()): number {
  const diffMs = slaDeadline.getTime() - currentTime.getTime();
  return diffMs / (1000 * 60 * 60); // Converter para horas
}

/**
 * Formata o tempo restante do SLA de forma legível
 * @param slaDeadline - Data/hora limite do SLA
 * @param currentTime - Data/hora atual (opcional, usa new Date() se não fornecido)
 * @returns string - String formatada (ex: "2h", "3d", "1m")
 */
export function formatRemainingSLA(slaDeadline: Date, currentTime: Date = new Date()): string {
  const hours = getRemainingSLAHours(slaDeadline, currentTime);
  
  if (hours < 0) {
    const overdueHours = Math.abs(hours);
    if (overdueHours < 24) {
      return `Vencido há ${Math.round(overdueHours)}h`;
    } else if (overdueHours < 720) {
      return `Vencido há ${Math.round(overdueHours / 24)}d`;
    } else {
      return `Vencido há ${Math.round(overdueHours / 720)}m`;
    }
  }
  
  if (hours < 24) {
    return `${Math.round(hours)}h restantes`;
  } else if (hours < 720) {
    return `${Math.round(hours / 24)}d restantes`;
  } else {
    return `${Math.round(hours / 720)}m restantes`;
  }
}

