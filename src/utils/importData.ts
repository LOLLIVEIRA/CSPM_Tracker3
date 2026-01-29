import { Misconfiguration, Severity, Provider, Status } from '../types';
import { calculateSLADeadline } from './sla';
export const parseCSV = (csvContent: string): Misconfiguration[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  const data: Misconfiguration[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 10) continue;
    try {
      const detectedAt = new Date(values[8].trim());
      const severity = values[1].trim() as Severity;
      data.push({
        id: values[0].trim(),
        severity,
        provider: values[2].trim() as Provider,
        resource: values[3].replace(/^"|"$/g, '').trim(),
        description: values[4].replace(/^"|"$/g, '').trim(),
        resolver: values[5].trim() === 'Unassigned' ? null : values[5].trim(),
        status: values[6].trim() as Status,
        // Recalcular SLA baseado em CVSS padrão de mercado
        slaDeadline: calculateSLADeadline(severity, detectedAt),
        detectedAt,
        crowdstrikeId: values[9].trim()
      });
    } catch (error) {
      console.error(`Erro ao processar linha ${i + 1}:`, error);
    }
  }
  return data;
};
export const parseJSON = (jsonContent: string): Misconfiguration[] => {
  try {
    const data = JSON.parse(jsonContent);
    if (!Array.isArray(data)) {
      throw new Error('JSON deve ser um array de tickets');
    }
    return data.map(item => {
      const detectedAt = new Date(item.detectedAt);
      const severity = item.severity as Severity;
      return {
        ...item,
        // Recalcular SLA baseado em CVSS padrão de mercado
        slaDeadline: calculateSLADeadline(severity, detectedAt),
        detectedAt
      };
    });
  } catch (error) {
    console.error('Erro ao processar JSON:', error);
    throw error;
  }
};
export const validateMisconfiguration = (item: any): boolean => {
  const requiredFields = ['id', 'severity', 'provider', 'resource', 'description', 'status', 'slaDeadline', 'detectedAt', 'crowdstrikeId'];
  for (const field of requiredFields) {
    if (!item[field]) return false;
  }
  const validSeverities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMAL'];
  const validProviders: Provider[] = ['AWS', 'GCP', 'Azure'];
  const validStatuses: Status[] = ['Open', 'In Progress', 'Resolved', 'Overdue'];
  if (!validSeverities.includes(item.severity)) return false;
  if (!validProviders.includes(item.provider)) return false;
  if (!validStatuses.includes(item.status)) return false;
  return true;
};