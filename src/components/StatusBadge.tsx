import React from 'react';
import { Status } from '../types';
interface StatusBadgeProps {
  status: Status;
}
const COLORS: Record<Status, string> = {
  Open: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};
const DOT_COLORS: Record<Status, string> = {
  Open: 'bg-gray-400',
  'In Progress': 'bg-blue-400',
  Resolved: 'bg-green-400',
  Overdue: 'bg-red-400'
};
export function StatusBadge({
  status
}: StatusBadgeProps) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLORS[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${DOT_COLORS[status]}`} />
      {status}
    </span>;
}