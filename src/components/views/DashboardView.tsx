import React, { useState } from 'react';
import { useApp, isViewAllowed } from '../../context/AppContext';
import { KpiCard } from '../common/KpiCard';
import { StatusBadge } from '../common/StatusBadge';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Activity, 
  Cpu, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  History
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    tools, 
    machines, 
    consumptions, 
    missedAlerts, 
    setCurrentView, 
    setSelectedToolForDrawer,
    activeRole
  } = useApp();

  const [machineFilter, setMachineFilter] = useState<string>('all');

  const activeTools = tools.filter(t => t.status === 'active');
  const healthyCount = activeTools.filter(t => t.lifespanCondition === 'healthy').length;
  const moderateCount = activeTools.filter(t => t.lifespanCondition === 'moderate').length;
  const criticalCount = activeTools.filter(t => t.lifespanCondition === 'critical').length;
  const replacedCount = tools.filter(t => t.status === 'replaced').length;

  const totalStrokes = consumptions.reduce((acc, curr) => acc + curr.quantity, 0);
  const pendingMissedCount = missedAlerts.filter(a => !a.isResolved).length;

  // Filtered tools for display
  const criticalTools = activeTools.filter(t => t.lifespanCondition === 'critical');
  const moderateTools = activeTools.filter(t => t.lifespanCondition === 'moderate');

  // Realistic 7-day consumption data points
  const recentDays = [
    { day: 'Thu 10/15', s1: 3200, s2: 2800, s3: 1500, total: 7500 },
    { day: 'Fri 10/16', s1: 3400, s2: 3100, s3: 1800, total: 8300 },
    { day: 'Sat 10/17', s1: 3100, s2: 2400, s3: 1200, total: 6700 },
    { day: 'Sun 10/18', s1: 800, s2: 0, s3: 0, total: 800 }, // Sunday exceptional
    { day: 'Mon 10/19', s1: 3600, s2: 3200, s3: 1900, total: 8700 },
    { day: 'Tue 10/20', s1: 3850, s2: 3350, s3: 1400, total: 8600 },
    { day: 'Wed 10/21', s1: 3970, s2: 1200, s3: 0, total: 5170 } // Current day partial
  ];

  const maxDayTotal = Math.max(...recentDays.map(d => d.total));

  // Hourly sparkline data for current shift (06:00 to 14:00)
  const healthyHourlyTrend = [
    { hour: '06:00', count: 6 },
    { hour: '07:00', count: 6 },
    { hour: '08:00', count: 6 },
    { hour: '09:00', count: 5 },
    { hour: '10:00', count: 5 },
    { hour: '11:00', count: 5 },
    { hour: '12:00', count: 4 },
    { hour: '13:00', count: 4 },
    { hour: '14:00', count: healthyCount }
  ];

  const expiredHourlyTrend = [
    { hour: '06:00', count: 1 },
    { hour: '07:00', count: 1 },
    { hour: '08:00', count: 1 },
    { hour: '09:00', count: 2 },
    { hour: '10:00', count: 2 },
    { hour: '11:00', count: 2 },
    { hour: '12:00', count: 2 },
    { hour: '13:00', count: 3 },
    { hour: '14:00', count: criticalCount }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Plant Overview */}
      {/* Top Banner / Plant Overview */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {activeRole === 'setter' ? 'Tool Setter Workstation' : 'Plant Floor Overview'}
            </span>
            <span className="text-xs text-slate-500">
              {activeRole === 'setter' ? '· Die & Machine Setup Readiness' : '· Precision Facility Operations'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeRole === 'setter' ? 'Tool Setter Dashboard & Fleet Wear Monitor' : 'Tool Lifetime & Production Health Monitor'}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {activeRole === 'setter'
              ? `Real-time die wear and machine tooling condition across ${machines.length} production presses. Authorized to edit tool specifications, machine assignments, and recipe parameters.`
              : `Real-time tracking of tool wear across ${machines.length} production machines and 3 shifts. Automatic remaining lifespan recalculation and critical replacement notifications.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {activeRole === 'setter' && (
            <button
              onClick={() => setCurrentView('tool-master')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Tool Master & Setup (Edit)</span>
            </button>
          )}
          {isViewAllowed(activeRole, 'shift-consumption') && (
            <button
              onClick={() => setCurrentView('shift-consumption')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Record Shift Consumption</span>
            </button>
          )}
          {isViewAllowed(activeRole, 'missed-consumption') && pendingMissedCount > 0 && (
            <button
              onClick={() => setCurrentView('missed-consumption')}
              className="px-3 py-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Resolve {pendingMissedCount} Missed Shifts</span>
            </button>
          )}
          {isViewAllowed(activeRole, 'activity-logs') && (
            <button
              onClick={() => setCurrentView('activity-logs')}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-600" />
              <span>Activity Logs</span>
            </button>
          )}
          {isViewAllowed(activeRole, 'tool-registration') && (
            <button
              onClick={() => setCurrentView('tool-registration')}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Tool</span>
            </button>
          )}
        </div>
      </div>

      {/* Tool Setter Readiness Station (Dedicated module for Setter Role) */}
      {activeRole === 'setter' && (
        <div className="bg-gradient-to-r from-[#0d1f38] via-[#0f2747] to-[#12233c] rounded-lg p-5 text-white shadow-sm border border-slate-700/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  Setter Readiness & Setup Station
                </span>
                <span className="text-xs text-slate-300 font-mono">Amit Borkar (EMP-SETTER) · Press Tooling Cell</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Tool Setup, Recipe Parameters & Die Wear Protocol
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                As a certified Tool Setter, you have direct authorization to edit mounted tool specifications, configure recipe parameters, and review stroke limits. (Registering brand new tools is reserved for Plant Admin).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentView('tool-master')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Open Tool Master (Edit Mode)</span>
              </button>
              <button
                onClick={() => setCurrentView('shift-consumption')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Log Shift Strokes</span>
              </button>
            </div>
          </div>

          {/* 3 Setter Focus Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 pt-4 border-t border-slate-700/70">
            <div className="bg-white/5 rounded-lg p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">Mounted on Presses</span>
                <span className="font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/20">{activeTools.length} Tools</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">Production Loaded</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Active across {machines.length} production machine cells</div>
            </div>

            <div className="bg-white/5 rounded-lg p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">Urgent Toolroom Regrind</span>
                <span className="font-mono text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/20">{criticalCount} Critical</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">≤10% Remaining Life</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Stage backup dies & flag for toolroom inspection</div>
            </div>

            <div className="bg-white/5 rounded-lg p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium">Near End-of-Life Watch</span>
                <span className="font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/20">{moderateCount} Moderate</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">10% – 30% Remaining Life</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Verify punch/die clearance & lubrication</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Registered Tools"
          value={tools.length}
          subtext={`${activeTools.length} Active in Production`}
          icon={<Wrench className="w-4 h-4" />}
          badge={`${replacedCount} Replaced`}
          onClick={() => setCurrentView('tool-master')}
        />
        <KpiCard
          label="Healthy Tools"
          value={healthyCount}
          subtext="Hourly shift trend"
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          badge={`${Math.round((healthyCount / (activeTools.length || 1)) * 100)}%`}
          badgeColor="emerald"
          sparkline={
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthyHourlyTrend} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="healthyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow-xs">
                            {payload[0].payload.hour}: {payload[0].value} tools
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={1.8}
                    fillOpacity={1}
                    fill="url(#healthyAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
        />
        <KpiCard
          label="Near End of Life"
          value={moderateCount}
          subtext="Lifespan 10% - 30% remaining"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          badge="Attention"
          badgeColor="amber"
          onClick={() => setCurrentView('tool-master')}
        />
        <KpiCard
          label="Critical / Expired"
          value={criticalCount}
          subtext="Hourly wear exhaustion"
          icon={<XCircle className="w-4 h-4 text-rose-600" />}
          badge="Action Req."
          badgeColor="rose"
          onClick={() => setCurrentView(isViewAllowed(activeRole, 'admin-tool-management') ? 'admin-tool-management' : 'tool-master')}
          sparkline={
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expiredHourlyTrend} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expiredAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow-xs">
                            {payload[0].payload.hour}: {payload[0].value} expired
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#f43f5e"
                    strokeWidth={1.8}
                    fillOpacity={1}
                    fill="url(#expiredAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
        />
        <KpiCard
          label="Cumulative Strokes"
          value={totalStrokes}
          subtext={`${consumptions.length} Shift Logs Captured`}
          icon={<Activity className="w-4 h-4 text-blue-600" />}
          badge="Production Total"
          badgeColor="blue"
          onClick={() => setCurrentView(isViewAllowed(activeRole, 'reports-export') ? 'reports-export' : 'shift-consumption')}
        />
      </div>

      {/* Visual Analytics & Condition Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Shift-wise Consumption Graph */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Shift-Wise Consumption Trends</h2>
              <p className="text-xs text-slate-500">Daily stroke throughput broken down by Shift 1, 2, and 3</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> Shift 1
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block" /> Shift 2
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-300 inline-block" /> Shift 3
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-2">
            <div className="h-48 w-full flex items-end gap-3 sm:gap-6 border-b border-slate-200 pb-2">
              {recentDays.map((d, idx) => {
                const totalH = Math.max(10, Math.round((d.total / maxDayTotal) * 160));
                const s1H = (d.s1 / d.total) * totalH || 0;
                const s2H = (d.s2 / d.total) * totalH || 0;
                const s3H = (d.s3 / d.total) * totalH || 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap font-mono shadow-md">
                      <div>Total: {d.total.toLocaleString()} strokes</div>
                      <div className="text-slate-300">S1: {d.s1} · S2: {d.s2} · S3: {d.s3}</div>
                    </div>

                    <div className="w-full max-w-[40px] flex flex-col justify-end rounded-t overflow-hidden bg-slate-100">
                      <div style={{ height: `${s3H}px` }} className="w-full bg-indigo-300" />
                      <div style={{ height: `${s2H}px` }} className="w-full bg-sky-400" />
                      <div style={{ height: `${s1H}px` }} className="w-full bg-blue-600" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 truncate w-full text-center">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
              <span>Standard plant production: 3 shifts / 24 hours</span>
              <span className="font-mono font-medium text-slate-700">Avg: 6,967 strokes/day</span>
            </div>
          </div>
        </div>

        {/* Tool Fleet Condition Matrix */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Lifespan Distribution</h2>
              <span className="text-xs font-mono text-slate-500">{activeTools.length} Active Tools</span>
            </div>

            {/* Proportion Bars */}
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-800">Healthy (&gt;30% life)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {healthyCount} ({Math.round((healthyCount / (activeTools.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${(healthyCount / (activeTools.length || 1)) * 100}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-800">Near End of Life (10% - 30%)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {moderateCount} ({Math.round((moderateCount / (activeTools.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${(moderateCount / (activeTools.length || 1)) * 100}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-800">Critical / Exhausted (≤10%)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {criticalCount} ({Math.round((criticalCount / (activeTools.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500" 
                    style={{ width: `${(criticalCount / (activeTools.length || 1)) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 mt-4">
            <div className="font-semibold text-slate-800 mb-1">Standard Replacement Protocol</div>
            Tools reaching &le;10% must be flagged for immediate toolroom staging to avoid unplanned stamping line stops.
          </div>
        </div>
      </div>

      {/* Machine-Wise Tool Health & Critical Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine-Wise Health Matrix */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Machine Fleet Tool Status</h2>
              <p className="text-xs text-slate-500">Live operational status and active tools mounted per machine cell</p>
            </div>
            {isViewAllowed(activeRole, 'master-data') ? (
              <button
                onClick={() => setCurrentView('master-data')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Machines</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('tool-master')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Mounted Tools</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
            {machines.map(m => {
              const machineTools = tools.filter(t => t.primaryMachineId === m.id && t.status === 'active');
              const hasCritical = machineTools.some(t => t.lifespanCondition === 'critical');
              const hasModerate = machineTools.some(t => t.lifespanCondition === 'moderate');

              return (
                <div key={m.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700">
                      {m.code.split('-')[1] || 'MC'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{m.code}</span>
                        <span className="text-xs text-slate-700 font-medium truncate">{m.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {m.location} · <span className="font-mono">{machineTools.length} active tools</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {hasCritical ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 border border-rose-300 text-rose-800">
                        Critical Tool Alert
                      </span>
                    ) : hasModerate ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-800">
                        Moderate Wear
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800">
                        Healthy Fleet
                      </span>
                    )}

                    {activeRole === 'setter' && (
                      <button
                        onClick={() => setCurrentView('tool-master')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                        title="Inspect & configure tools mounted on this machine"
                      >
                        <Wrench className="w-3 h-3 text-blue-600" />
                        <span>Setup Tools</span>
                      </button>
                    )}

                    <button
                      onClick={() => setCurrentView('shift-consumption')}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    >
                      Log Shift
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Attention & Replacement Watchlist */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Replacement Watchlist</span>
              </h2>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {criticalTools.length} Urgent
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tools that have reached or are approaching zero remaining lifespan.
            </p>

            <div className="space-y-2.5">
              {criticalTools.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
                  No tools currently in critical condition.
                </div>
              ) : (
                criticalTools.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedToolForDrawer(t)}
                    className="p-3 bg-rose-50/50 border border-rose-200 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-900">{t.id}</span>
                      <span className="font-mono text-xs font-bold text-rose-700 tabular-nums">
                        {t.remainingLifespan.toLocaleString()} left
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 font-medium truncate mt-0.5">{t.itemName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                      <span>{t.primaryMachineId}</span>
                      <span className="text-blue-700 font-medium hover:underline">Inspect Details &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            {isViewAllowed(activeRole, 'admin-tool-management') ? (
              <button
                onClick={() => setCurrentView('admin-tool-management')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Open Tool Replacement Panel</span>
              </button>
            ) : activeRole === 'setter' ? (
              <button
                onClick={() => setCurrentView('tool-master')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Inspect & Edit Critical Tools in Master List</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('tool-master')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Inspect All Tools in Master List</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
