import React from 'react';
import { useApp, ViewType, ROLE_PERMISSIONS, isViewAllowed } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Wrench, 
  PlusCircle, 
  ClipboardCheck, 
  AlertCircle, 
  SlidersHorizontal, 
  Database, 
  FileSpreadsheet,
  Shield,
  History
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  badge?: number;
  badgeType?: 'danger' | 'warning' | 'info';
}

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    missedAlerts, 
    tools, 
    activeRole,
    isSidebarCollapsed
  } = useApp();

  const unresolvedMissed = missedAlerts.filter(a => !a.isResolved).length;
  const criticalTools = tools.filter(t => t.lifespanCondition === 'critical' && t.status === 'active').length;

  const roleConfig = ROLE_PERMISSIONS[activeRole];

  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Plant Dashboard',
      sublabel: 'Tool health & fleet metrics',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: criticalTools > 0 ? criticalTools : undefined,
      badgeType: 'danger'
    },
    {
      id: 'tool-master',
      label: 'Tool Master List',
      sublabel: 'Full tooling inventory & wear',
      icon: <Wrench className="w-4 h-4" />
    },
    {
      id: 'shift-consumption',
      label: 'Shift Consumption',
      sublabel: 'Operator end-of-shift entry',
      icon: <ClipboardCheck className="w-4 h-4" />
    },
    {
      id: 'missed-consumption',
      label: 'Missed & Corrections',
      sublabel: 'Supervisor audit & backlog',
      icon: <AlertCircle className="w-4 h-4" />,
      badge: unresolvedMissed > 0 ? unresolvedMissed : undefined,
      badgeType: 'warning'
    },
    {
      id: 'tool-registration',
      label: 'Tool Registration',
      sublabel: 'Onboard new tools & recipes',
      icon: <PlusCircle className="w-4 h-4" />
    },
    {
      id: 'admin-tool-management',
      label: 'Admin Overrides & Swap',
      sublabel: 'Bulk zero & tool replacements',
      icon: <SlidersHorizontal className="w-4 h-4" />
    },
    {
      id: 'master-data',
      label: 'Master Data Admin',
      sublabel: 'Machines, users, Excel upload',
      icon: <Database className="w-4 h-4" />
    },
    {
      id: 'reports-export',
      label: 'Reports & Export',
      sublabel: 'Audit trails & Excel exports',
      icon: <FileSpreadsheet className="w-4 h-4" />
    },
    {
      id: 'activity-logs',
      label: 'Activity Logs',
      sublabel: 'User actions & audit trail',
      icon: <History className="w-4 h-4" />
    }
  ];

  // Strictly filter items: hide any module the active role lacks view permission for
  const visibleNavItems = allNavItems.filter(item => isViewAllowed(activeRole, item.id));

  return (
    <aside 
      className={`${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      } bg-[#0A192F] text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-800 h-screen sticky top-0 overflow-y-auto transition-all duration-200 z-40`}
    >
      {/* Authoritative Corporate Brand Header (Toggle handled in header) */}
      <div className={`p-3.5 border-b border-slate-800/80 bg-[#081223] flex items-center ${
        isSidebarCollapsed ? 'justify-center' : 'justify-start'
      }`}>
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-base tracking-tight shrink-0 shadow-sm shadow-red-950/40">
              R
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-wide truncate">Rosenberger</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                TLMS
              </span>
            </div>
          </div>
        ) : (
          <div 
            className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-base tracking-tight shadow-sm shadow-red-950/40"
            title="Rosenberger TLMS"
          >
            R
          </div>
        )}
      </div>

      {/* Role Workspace Banner (Visible when expanded) */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-2.5 bg-[#0d1f38] border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                {roleConfig.label}
              </span>
            </div>
            <span className="font-mono text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/40 px-1.5 py-0.5 rounded font-semibold">
              {visibleNavItems.length} {visibleNavItems.length === 1 ? 'Duty' : 'Duties'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
            {roleConfig.duties}
          </p>
        </div>
      )}

      {/* Main Navigation Menu: Only Permitted Items Rendered */}
      <div className={`flex-1 py-3 ${isSidebarCollapsed ? 'px-1.5 space-y-1.5' : 'px-2 space-y-1'}`}>
        {!isSidebarCollapsed && (
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{activeRole === 'admin' ? 'Plant System Modules' : `${roleConfig.label} Workspace`}</span>
            <span className="font-mono text-slate-500">{visibleNavItems.length} Active</span>
          </div>
        )}

        {visibleNavItems.map(item => {
          const isActive = currentView === item.id;

          if (isSidebarCollapsed) {
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-center p-2.5 rounded-md transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
                title={`${item.label} (${item.sublabel})`}
              >
                <span>{item.icon}</span>

                {/* Badge indicator in collapsed mode */}
                {item.badge !== undefined && (
                  <span
                    className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                      item.badgeType === 'danger'
                        ? 'bg-rose-500'
                        : item.badgeType === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                )}

                {/* Floating tooltip */}
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
                  {item.label}
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-all cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight truncate">
                    {item.label}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {item.sublabel}
                  </div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    item.badgeType === 'danger'
                      ? 'bg-rose-500 text-white'
                      : item.badgeType === 'warning'
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className={`p-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex items-center ${
        isSidebarCollapsed ? 'justify-center' : 'justify-between'
      } bg-[#081223]`}>
        {!isSidebarCollapsed ? (
          <>
            <span>TLMS RBAC</span>
            <span className="text-blue-400 font-semibold">{activeRole.toUpperCase()}</span>
          </>
        ) : (
          <span className="text-[10px] text-blue-400 font-bold">{activeRole.substring(0, 3).toUpperCase()}</span>
        )}
      </div>
    </aside>
  );
};
