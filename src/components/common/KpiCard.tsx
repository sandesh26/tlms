import React, { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  onClick?: () => void;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  sparkline?: ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  badge,
  badgeColor = 'slate',
  onClick,
  trend,
  sparkline
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200'
  }[badgeColor];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-lg p-4 transition-all duration-150 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{label}</span>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {badge && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeClasses} whitespace-nowrap`}>
              {badge}
            </span>
          )}
        </div>

        {sparkline && (
          <div className="mt-2.5 mb-1 w-full overflow-hidden">
            {sparkline}
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span className={`font-medium tabular-nums ${trend.isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
              {trend.value} <span className="text-slate-400 font-normal">{trend.label}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
