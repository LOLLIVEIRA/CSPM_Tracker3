import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Metric } from '../types';
interface MetricCardProps {
  metric: Metric;
  onClick?: () => void;
  index?: number;
}
export function MetricCard({
  metric,
  onClick,
  index = 0
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };
  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'down':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800';
    }
  };
  const getSeverityColor = () => {
    if (!metric.severity) return 'bg-slate-100 dark:bg-slate-800';
    switch (metric.severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-blue-500';
      case 'INFORMAL':
        return 'bg-gray-500';
    }
  };
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay: index * 0.1
  }} whileHover={{
    y: -4,
    transition: {
      duration: 0.2
    }
  }} onClick={onClick} className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group`}>
      {metric.severity && <div className={`absolute top-0 left-0 w-1 h-full ${getSeverityColor()}`} />}

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {metric.label}
        </h3>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getTrendColor()}`}>
          {getTrendIcon()}
          {metric.trendValue}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          {metric.count}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          tickets
        </span>
      </div>
    </motion.div>;
}