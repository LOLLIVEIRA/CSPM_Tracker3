export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMAL';
export type Provider = 'AWS' | 'GCP' | 'Azure';
export type Status = 'Open' | 'In Progress' | 'Resolved' | 'Overdue';
export type UserRole = 'admin' | 'viewer';
export interface User {
  id: string;
  username: string;
  password: string; // Em produção, isso seria um hash
  otpSecret: string; // Secret para gerar códigos OTP (TOTP)
  role: UserRole;
  createdAt: Date;
}
export interface Resolver {
  name: string;
  email: string;
}
export interface Misconfiguration {
  id: string;
  severity: Severity;
  provider: Provider;
  resource: string;
  description: string;
  resolver: Resolver | null;
  status: Status;
  slaDeadline: Date;
  detectedAt: Date;
  crowdstrikeId: string;
}
export interface Metric {
  label: string;
  count: number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  severity?: Severity;
}
export interface FilterState {
  search: string;
  severity: Severity[];
  provider: Provider[];
  status: Status[];
  resolver: string;
}