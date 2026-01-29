import React from 'react';
import { Severity } from '../types';
interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}
const COLORS: Record<Severity, string> = {
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  INFORMAL: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
};
export function SeverityBadge({
  severity,
  className = ''
}: SeverityBadgeProps) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${COLORS[severity]} ${className}`}>
      {severity}
    </span>;
}