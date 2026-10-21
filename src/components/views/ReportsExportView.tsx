import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { KpiCard } from '../common/KpiCard';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  Filter, 
  Layers, 
  Activity, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

export const ReportsExportView: React.FC = () => {
  const { 
    consumptions, 
    tools, 
    machines, 
    shifts, 
    corrections, 
    showToast,
    setSelectedToolForDrawer
  } = useApp();

  const [reportType, setReportType] = useState<'consumption' | 'tool_health'>('consumption');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-21');
  const [selectedMachineId, setSelectedMachineId] = useState('all');
  const [selectedShiftId, setSelectedShiftId] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered consumptions
  const filteredConsumptions = useMemo(() => {
    return consumptions.filter(c => {
      // Date filter
      if (startDate && c.productionDate < startDate) return false;
      if (endDate && c.productionDate > endDate) return false;

      // Machine filter
      if (selectedMachineId !== 'all' && c.machineId !== selectedMachineId) return false;

      // Shift filter
      if (selectedShiftId !== 'all' && c.shiftId !== selectedShiftId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (
          c.id.toLowerCase().includes(q) ||
          c.toolId.toLowerCase().includes(q) ||
          c.toolName.toLowerCase().includes(q) ||
          c.userName.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [consumptions, startDate, endDate, selectedMachineId, selectedShiftId, searchQuery]);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      if (selectedMachineId !== 'all' && t.primaryMachineId !== selectedMachineId) return false;
      if (selectedCondition !== 'all' && t.lifespanCondition !== selectedCondition) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (
          t.id.toLowerCase().includes(q) ||
          t.productCode.toLowerCase().includes(q) ||
          t.itemName.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [tools, selectedMachineId, selectedCondition, searchQuery]);

  // Aggregate metrics
  const totalStrokesInRange = filteredConsumptions.reduce((sum, c) => sum + c.quantity, 0);
  const totalLogsInRange = filteredConsumptions.length;
  const criticalToolsCount = filteredTools.filter(t => t.lifespanCondition === 'critical').length;
  const averageUtilization = tools.length > 0
    ? Math.round(tools.reduce((acc, t) => acc + (t.consumedLifespan / t.maxLifespan), 0) / tools.length * 100)
    : 0;

  // Export to CSV
  const handleExportCSV = () => {
    if (reportType === 'consumption') {
      const headers = ['Entry ID', 'Date', 'Shift', 'Machine Code', 'Tool ID', 'Tool Name', 'Strokes', 'Logged By', 'Entry Type', 'Post Remaining Lifespan', 'Reason'];
      const rows = filteredConsumptions.map(c => [
        c.id,
        c.productionDate,
        `"${c.shiftName}"`,
        c.machineCode,
        c.toolId,
        `"${c.toolName.replace(/"/g, '""')}"`,
        c.quantity,
        `"${c.userName}"`,
        c.entryType,
        c.newRemaining,
        `"${(c.reason || '').replace(/"/g, '""')}"`
      ]);

      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csv);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rosenberger_Consumption_Audit_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported Consumption Audit Report to CSV', 'success');
    } else {
      const headers = ['Tool ID', 'Product Code', 'Item Name', 'Machine', 'Recipe', 'Max Lifespan', 'Consumed Lifespan', 'Remaining Lifespan', 'Condition', 'Status', 'Last Logged'];
      const rows = filteredTools.map(t => [
        t.id,
        t.productCode,
        `"${t.itemName.replace(/"/g, '""')}"`,
        t.primaryMachineId,
        t.recipeNumber,
        t.maxLifespan,
        t.consumedLifespan,
        t.remainingLifespan,
        t.lifespanCondition,
        t.status,
        t.lastConsumptionDate || 'None'
      ]);

      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csv);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rosenberger_Tool_Lifespan_Status_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported Tool Health Summary to CSV', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Traceability & Compliance
            </span>
            <span className="text-xs text-slate-500 font-mono">TLMS §4.4 Data Export & Reporting</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports, Analytics & Data Export</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate ISO-compliant audit logs, machine throughput reports, and tool wear projections with real Excel/CSV exports.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Strokes in Range"
          value={totalStrokesInRange}
          subtext={`Across ${totalLogsInRange} Shift Records`}
          icon={<Activity className="w-4 h-4 text-blue-600" />}
          badge="Audit Total"
        />
        <KpiCard
          label="Recorded Shift Logs"
          value={totalLogsInRange}
          subtext={`${filteredConsumptions.filter(c => c.entryType === 'supervisor_missed').length} Supervisor Entries`}
          icon={<Clock className="w-4 h-4 text-slate-600" />}
        />
        <KpiCard
          label="Average Tool Wear"
          value={`${averageUtilization}%`}
          subtext="Fleet-wide lifespan utilization"
          icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
          badge={averageUtilization > 60 ? 'Moderate Wear' : 'Optimal'}
          badgeColor={averageUtilization > 60 ? 'amber' : 'emerald'}
        />
        <KpiCard
          label="Critical Replacements"
          value={criticalToolsCount}
          subtext="Tools requiring replacement"
          icon={<ShieldCheck className="w-4 h-4 text-rose-600" />}
          badge={criticalToolsCount > 0 ? 'Urgent' : 'Nominal'}
          badgeColor={criticalToolsCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Report Controls & Filter Panel */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Report Type Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setReportType('consumption')}
              className={`px-3 py-1.5 rounded transition-all ${
                reportType === 'consumption'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shift Consumption Ledger ({filteredConsumptions.length})
            </button>
            <button
              onClick={() => setReportType('tool_health')}
              className={`px-3 py-1.5 rounded transition-all ${
                reportType === 'tool_health'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tool Lifespan Health Matrix ({filteredTools.length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Date Interval: {startDate} &rarr; {endDate}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Machine Cell</label>
            <select
              value={selectedMachineId}
              onChange={e => setSelectedMachineId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-medium"
            >
              <option value="all">All Machines (Fleet-wide)</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.code} ({m.name.split(' ')[0]})</option>
              ))}
            </select>
          </div>

          {reportType === 'consumption' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Production Shift</label>
              <select
                value={selectedShiftId}
                onChange={e => setSelectedShiftId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-medium"
              >
                <option value="all">All Shifts (1, 2, 3)</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lifespan Condition</label>
              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-medium"
              >
                <option value="all">All Conditions</option>
                <option value="healthy">Healthy (&gt;30%)</option>
                <option value="moderate">Near End of Life (10-30%)</option>
                <option value="critical">Critical / Expired (&le;10%)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ID, user, tool..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        {reportType === 'consumption' ? (
          /* Table 1: Consumption Audit Records */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="px-4 py-3">Entry ID</th>
                  <th className="px-3 py-3">Date / Shift</th>
                  <th className="px-3 py-3">Machine</th>
                  <th className="px-3 py-3">Tool ID & Specification</th>
                  <th className="px-3 py-3 text-right">Strokes</th>
                  <th className="px-3 py-3 text-right">Remaining Post-Shift</th>
                  <th className="px-3 py-3">Logged By</th>
                  <th className="px-3 py-3">Entry Type</th>
                  <th className="px-4 py-3">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredConsumptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No consumption records match the specified filters.
                    </td>
                  </tr>
                ) : (
                  filteredConsumptions.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{entry.id}</td>
                      <td className="px-3 py-3 font-mono">
                        <div className="text-slate-900 font-medium">{entry.productionDate}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{entry.shiftName}</div>
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-slate-800">{entry.machineCode}</td>
                      <td className="px-3 py-3">
                        <div className="font-mono font-bold text-slate-900">{entry.toolId}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{entry.toolName}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {entry.quantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-700 tabular-nums">
                        {entry.newRemaining.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-slate-800 font-medium">{entry.userName}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{entry.userRole}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          entry.entryType === 'normal'
                            ? 'bg-slate-100 text-slate-700'
                            : entry.entryType === 'supervisor_missed'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : entry.entryType === 'admin_override'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : entry.entryType === 'correction'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {entry.entryType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600 truncate max-w-xs">
                        {entry.reason || 'Routine end-of-shift record'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Table 2: Tool Health Matrix */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="px-4 py-3">Tool ID</th>
                  <th className="px-3 py-3">Product / Recipe</th>
                  <th className="px-3 py-3">Machine</th>
                  <th className="px-3 py-3 text-right">Max Rated Life</th>
                  <th className="px-3 py-3 text-right">Consumed Life</th>
                  <th className="px-4 py-3 text-right">Remaining Life</th>
                  <th className="px-3 py-3 text-center">Condition</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Last Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredTools.map(t => {
                  const percentRem = t.maxLifespan > 0
                    ? Math.round((t.remainingLifespan / t.maxLifespan) * 100)
                    : 0;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedToolForDrawer(t)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{t.id}</td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-slate-900 font-medium">{t.productCode}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.recipeNumber}</div>
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-700">{t.primaryMachineId}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-600">
                        {t.maxLifespan.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-800 font-medium">
                        {t.consumedLifespan.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          {t.remainingLifespan.toLocaleString()} ({percentRem}%)
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge condition={t.lifespanCondition} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">
                        {t.lastConsumptionDate || 'None'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
