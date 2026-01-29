import { Misconfiguration } from '../types';
export const exportToCSV = (data: Misconfiguration[]) => {
  const headers = ['ID', 'Severity', 'Provider', 'Resource', 'Description', 'Resolver', 'Status', 'SLA Deadline', 'Detected At', 'Crowdstrike ID'];
  const csvContent = [headers.join(','), ...data.map(item => [item.id, item.severity, item.provider, `"${item.resource}"`,
  // Quote to handle potential commas
  `"${item.description}"`, item.resolver || 'Unassigned', item.status, item.slaDeadline.toISOString(), item.detectedAt.toISOString(), item.crowdstrikeId].join(','))].join('\n');
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `cspm_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
export const exportToJSON = (data: Misconfiguration[]) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], {
    type: 'application/json'
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `cspm_report_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};