import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(t => {
        const icon = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0" />
        }[t.type];

        const borderClass = {
          success: 'border-emerald-300 bg-white',
          warning: 'border-amber-300 bg-white',
          error: 'border-rose-300 bg-white',
          info: 'border-blue-300 bg-white'
        }[t.type];

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-lg flex items-start gap-3 transition-all duration-200 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              {t.title && <div className="text-xs font-bold text-slate-900 tracking-wide">{t.title}</div>}
              <div className="text-xs text-slate-700 leading-relaxed font-sans">{t.message}</div>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
