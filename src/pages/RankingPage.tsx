import React, { useMemo } from 'react';
import { Misconfiguration, Resolver, Severity } from '../types';
import { Trophy, Medal, Award, CheckCircle, TrendingUp, User, Clock, AlertCircle, Target, BarChart3, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface RankingPageProps {
  data: Misconfiguration[];
  resolvers: Resolver[];
}

interface ResolverStats {
  resolver: Resolver;
  resolvedCount: number;
  resolvedWithinSLA: number;
  resolvedOutsideSLA: number;
  inProgressCount: number;
  overdueCount: number;
  totalAssigned: number;
  avgResolutionTime: number; // em horas
  slaComplianceRate: number; // porcentagem
  severityBreakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFORMAL: number;
  };
}

export function RankingPage({ data, resolvers }: RankingPageProps) {
  const ranking = useMemo(() => {
    const now = new Date();
    const statsMap = new Map<string, ResolverStats>();

    // Inicializar todos os resolvedores
    resolvers.forEach(resolver => {
      statsMap.set(resolver.email, {
        resolver,
        resolvedCount: 0,
        resolvedWithinSLA: 0,
        resolvedOutsideSLA: 0,
        inProgressCount: 0,
        overdueCount: 0,
        totalAssigned: 0,
        avgResolutionTime: 0,
        slaComplianceRate: 0,
        severityBreakdown: {
          CRITICAL: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0,
          INFORMAL: 0,
        },
      });
    });

    // Contar tickets por resolvedor
    const resolvedTicketsByResolver = new Map<string, number[]>();

    data.forEach(ticket => {
      if (ticket.resolver) {
        const email = ticket.resolver.email;
        const stats = statsMap.get(email);

        if (stats) {
          stats.totalAssigned++;
          stats.severityBreakdown[ticket.severity]++;

          if (ticket.status === 'Resolved') {
            stats.resolvedCount++;
            // Para tickets resolvidos, verificamos se foram resolvidos dentro ou fora do SLA
            // Se o deadline ainda não passou, consideramos dentro do SLA
            // Se passou, consideramos fora do SLA
            if (now <= ticket.slaDeadline) {
              stats.resolvedWithinSLA++;
            } else {
              stats.resolvedOutsideSLA++;
            }
            // Calcular tempo de resolução (assumindo resolução agora para cálculo)
            const resolutionTime = (now.getTime() - ticket.detectedAt.getTime()) / (1000 * 60 * 60);
            if (!resolvedTicketsByResolver.has(email)) {
              resolvedTicketsByResolver.set(email, []);
            }
            resolvedTicketsByResolver.get(email)!.push(resolutionTime);
          } else if (ticket.status === 'In Progress') {
            stats.inProgressCount++;
          } else if (ticket.status === 'Overdue') {
            stats.overdueCount++;
          }
        }
      }
    });

    // Calcular tempo médio de resolução e taxa de conformidade SLA
    statsMap.forEach((stats) => {
      const resolverResolvedTimes = resolvedTicketsByResolver.get(stats.resolver.email) || [];

      if (resolverResolvedTimes.length > 0) {
        const totalResolutionTime = resolverResolvedTimes.reduce((sum, time) => sum + time, 0);
        stats.avgResolutionTime = totalResolutionTime / resolverResolvedTimes.length;
      }

      // Taxa de conformidade SLA: (resolvidos dentro do SLA / total resolvidos) * 100
      if (stats.resolvedCount > 0) {
        stats.slaComplianceRate = Math.round(
          (stats.resolvedWithinSLA / stats.resolvedCount) * 100
        );
      }
    });

    // Converter para array e ordenar
    const rankingArray = Array.from(statsMap.values())
      .filter(stats => stats.totalAssigned > 0)
      .sort((a, b) => {
        // Ordenar por: 1) resolvidos dentro do SLA (decrescente), 2) total resolvidos (decrescente), 3) taxa de conformidade (decrescente)
        if (b.resolvedWithinSLA !== a.resolvedWithinSLA) {
          return b.resolvedWithinSLA - a.resolvedWithinSLA;
        }
        if (b.resolvedCount !== a.resolvedCount) {
          return b.resolvedCount - a.resolvedCount;
        }
        return b.slaComplianceRate - a.slaComplianceRate;
      });

    return rankingArray;
  }, [data, resolvers]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return (
      <div className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">
        {index + 1}
      </div>
    );
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    if (index === 1) return 'from-slate-400/20 to-slate-500/10 border-slate-400/30';
    if (index === 2) return 'from-amber-600/20 to-amber-700/10 border-amber-600/30';
    return 'from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700';
  };

  const calculateSuccessRate = (stats: ResolverStats) => {
    if (stats.totalAssigned === 0) return 0;
    return Math.round((stats.resolvedCount / stats.totalAssigned) * 100);
  };

  const formatDuration = (hours: number): string => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else if (hours < 168) {
      return `${Math.round(hours / 24)}d`;
    } else {
      return `${Math.round(hours / 168)}sem`;
    }
  };

  const totalResolved = data.filter(t => t.status === 'Resolved').length;
  const totalInProgress = data.filter(t => t.status === 'In Progress').length;
  const totalOverdue = data.filter(t => t.status === 'Overdue').length;
  
  // Calcular estatísticas globais de SLA
  const now = new Date();
  const resolvedTickets = data.filter(t => t.status === 'Resolved');
  const resolvedWithinSLA = resolvedTickets.filter(
    t => now <= t.slaDeadline
  ).length;
  const resolvedOutsideSLA = resolvedTickets.length - resolvedWithinSLA;
  const globalSlaCompliance = resolvedTickets.length > 0
    ? Math.round((resolvedWithinSLA / resolvedTickets.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Ranking de Resolvedores
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Acompanhe quem está resolvendo mais vulnerabilidades
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Resolvidos
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalResolved}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {resolvedWithinSLA} dentro do SLA • {resolvedOutsideSLA} fora
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Conformidade SLA
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{globalSlaCompliance}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Taxa de conformidade global
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Vencidos
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalOverdue}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tickets em atraso
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Resolvedores Ativos
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{ranking.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Com tickets atribuídos
          </p>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Classificação
          </h2>
        </div>

        {ranking.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              Nenhum resolvedor com tickets atribuídos ainda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {ranking.map((stats, index) => {
              const successRate = calculateSuccessRate(stats);
              return (
                <motion.div
                  key={stats.resolver.email}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 bg-gradient-to-r ${getRankColor(index)} hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center gap-6">
                    {/* Posição no Ranking */}
                    <div className="flex-shrink-0">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar e Nome */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {stats.resolver.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Informações do Resolvedor */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                        {stats.resolver.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {stats.resolver.email}
                      </p>
                    </div>

                    {/* Estatísticas Principais */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {stats.resolvedCount}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Resolvidos
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {stats.resolvedWithinSLA} dentro SLA
                        </div>
                        {stats.resolvedOutsideSLA > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {stats.resolvedOutsideSLA} fora SLA
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.slaComplianceRate}%
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Conformidade SLA
                        </div>
                        {stats.avgResolutionTime > 0 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Média: {formatDuration(stats.avgResolutionTime)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estatísticas Secundárias */}
                    <div className="flex-shrink-0">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {stats.inProgressCount}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            Em Progresso
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-red-600 dark:text-red-400">
                            {stats.overdueCount}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            Vencidos
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {stats.totalAssigned}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            Total
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barras de Progresso */}
                  <div className="mt-4 space-y-2">
                    {/* Barra de Taxa de Sucesso */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Taxa de Resolução: {successRate}%</span>
                      </div>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Barra de Conformidade SLA */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Conformidade SLA: {stats.slaComplianceRate}%</span>
                      </div>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stats.slaComplianceRate >= 80
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                              : stats.slaComplianceRate >= 60
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                              : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${stats.slaComplianceRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown de Severidade */}
                    {stats.resolvedCount > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          Distribuição por Severidade (Resolvidos)
                        </div>
                        <div className="flex gap-1">
                          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMAL'] as Severity[]).map((severity) => {
                            const count = stats.severityBreakdown[severity];
                            const percentage = stats.resolvedCount > 0
                              ? (count / stats.resolvedCount) * 100
                              : 0;
                            const colors: Record<Severity, string> = {
                              CRITICAL: 'bg-red-600',
                              HIGH: 'bg-orange-500',
                              MEDIUM: 'bg-yellow-500',
                              LOW: 'bg-blue-500',
                              INFORMAL: 'bg-slate-400',
                            };
                            return (
                              <div
                                key={severity}
                                className={`${colors[severity]} rounded text-white text-[10px] px-1 py-0.5 flex-1 text-center`}
                                style={{ opacity: count > 0 ? 0.8 : 0.3 }}
                                title={`${severity}: ${count}`}
                              >
                                {count}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

