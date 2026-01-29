import React from 'react';
import { Misconfiguration, Metric, Resolver } from '../types';
import { MetricCard } from '../components/MetricCard';
import { MisconfigurationsTable } from '../components/MisconfigurationsTable';
import { PieChart, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
interface DashboardProps {
  data: Misconfiguration[];
  resolvers: Resolver[];
  onAssign: (id: string, resolver: Resolver) => void;
}
export function Dashboard({
  data,
  resolvers,
  onAssign
}: DashboardProps) {
  // Calculate metrics
  const criticalCount = data.filter(i => i.severity === 'CRITICAL' && i.status !== 'Resolved').length;
  const highCount = data.filter(i => i.severity === 'HIGH' && i.status !== 'Resolved').length;
  const overdueCount = data.filter(i => i.status === 'Overdue').length;
  const resolvedCount = data.filter(i => i.status === 'Resolved').length;
  const metrics: Metric[] = [{
    label: 'Críticos',
    count: criticalCount,
    trend: 'up',
    trendValue: '+12%',
    severity: 'CRITICAL'
  }, {
    label: 'Alta Severidade',
    count: highCount,
    trend: 'down',
    trendValue: '-5%',
    severity: 'HIGH'
  }, {
    label: 'SLA Vencidos',
    count: overdueCount,
    trend: 'up',
    trendValue: '+2',
    severity: 'INFORMAL'
  }, {
    label: 'Resolvidos (30d)',
    count: resolvedCount,
    trend: 'up',
    trendValue: '+18%',
    severity: 'LOW'
  }];
  const recentMisconfigurations = data.filter(i => i.status !== 'Resolved').sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime()).slice(0, 5);
  return <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Visão Geral de Segurança
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Insights em tempo real sobre misconfigurations e conformidade SLA.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity - Takes up 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Detecções Recentes
            </h3>
            <span className="text-sm text-slate-500">Últimas 24 horas</span>
          </div>
          <MisconfigurationsTable data={recentMisconfigurations} resolvers={resolvers} onAssign={onAssign} compact />
        </div>

        {/* SLA Compliance Status - Takes up 1 column */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Status SLA
          </h3>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Critical (4h SLA)
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    92%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{
                  width: '92%'
                }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    High (24h SLA)
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    88%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{
                  width: '88%'
                }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Medium (7d SLA)
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    98%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{
                  width: '98%'
                }} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Conformidade Geral
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    94.2%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}