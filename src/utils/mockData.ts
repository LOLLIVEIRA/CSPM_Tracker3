import { Misconfiguration, Severity, Provider, Status, Resolver } from '../types';
import { calculateSLADeadline, isTicketOverdue } from './sla';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMAL'];
const PROVIDERS: Provider[] = ['AWS', 'GCP', 'Azure'];
const STATUSES: Status[] = ['Open', 'In Progress', 'Resolved', 'Overdue'];
const RESOLVERS: (Resolver | null)[] = [{
  name: 'Alice Security',
  email: 'alice@company.com'
}, {
  name: 'Bob Cloud',
  email: 'bob@company.com'
}, {
  name: 'Charlie Ops',
  email: 'charlie@company.com'
}, {
  name: 'Diana Dev',
  email: 'diana@company.com'
}, null];
const RESOURCES = ['s3://production-logs-backup', 'vm-instance-db-primary', 'gcp-compute-frontend-v1', 'azure-blob-customer-data', 'vpc-main-security-group', 'iam-role-admin-access', 'k8s-cluster-prod-01', 'rds-postgres-financial', 'lb-public-gateway', 'lambda-process-payments'];
const DESCRIPTIONS = ['S3 bucket publicly accessible', 'Security group allows 0.0.0.0/0 on port 22', 'IAM role with excessive permissions', 'Database encryption disabled', 'MFA not enabled for root account', 'Kubernetes API server publicly accessible', 'Unencrypted EBS volume attached', 'Logging disabled for VPC flow logs', 'Storage account allows public access', 'Function URL accessible without authentication'];
function generateRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
export const generateMockData = (count: number = 30): Misconfiguration[] => {
  const data: Misconfiguration[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    const provider = PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
    const detectedAt = generateRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);

    // Calculate SLA deadline using centralized function
    const slaDeadline = calculateSLADeadline(severity, detectedAt);

    // Determine status based on deadline and randomness
    let status: Status = 'Open';
    if (Math.random() > 0.7) status = 'Resolved';else if (Math.random() > 0.5) status = 'In Progress';
    // Use centralized function to check if ticket is overdue
    if (status !== 'Resolved' && isTicketOverdue(slaDeadline, now)) {
      status = 'Overdue';
    }
    data.push({
      id: `MC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      severity,
      provider,
      resource: RESOURCES[Math.floor(Math.random() * RESOURCES.length)],
      description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
      resolver: RESOLVERS[Math.floor(Math.random() * RESOLVERS.length)],
      status,
      slaDeadline,
      detectedAt,
      crowdstrikeId: `CS-${now.getFullYear()}-${Math.floor(Math.random() * 1000000)}`
    });
  }
  return data.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
};
export const MOCK_DATA = generateMockData(35);