import React from 'react';
import { LifespanStatus, ToolStatus } from '../../types';

interface StatusBadgeProps {
  condition?: LifespanStatus;
  status?: ToolStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ condition, status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  if (condition) {
    switch (condition) {
      case 'healthy':
        return (
          <span className={`inline-flex items-center font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-800 ${sizeClasses}`}>
            Healthy
          </span>
        );
      case 'moderate':
        return (
          <span className={`inline-flex items-center font-medium rounded border border-amber-300 bg-amber-50 text-amber-800 ${sizeClasses}`}>
            Near End of Life
          </span>
        );
      case 'critical':
        return (
          <span className={`inline-flex items-center font-medium rounded border border-rose-300 bg-rose-50 text-rose-800 ${sizeClasses}`}>
            Critical / Expired
          </span>
        );
    }
  }

  if (status) {
    switch (status) {
      case 'active':
        return (
          <span className={`inline-flex items-center font-medium rounded border border-slate-300 bg-slate-50 text-slate-700 ${sizeClasses}`}>
            Active
          </span>
        );
      case 'maintenance':
        return (
          <span className={`inline-flex items-center font-medium rounded border border-blue-300 bg-blue-50 text-blue-800 ${sizeClasses}`}>
            Maintenance
          </span>
        );
      case 'replaced':
        return (
          <span className={`inline-flex items-center font-medium rounded border border-slate-300 bg-slate-100 text-slate-500 ${sizeClasses}`}>
            Replaced
          </span>
        );
      case 'inactive':
        return (
          <span className={`inline-flex items-center font-medium rounded border border-slate-200 bg-slate-50 text-slate-400 ${sizeClasses}`}>
            Inactive
          </span>
        );
    }
  }

  return null;
};
