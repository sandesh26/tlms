import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityLog, ActivityActionType, ActivitySeverity, UserRole } from '../../types';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RotateCw, 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  CheckCircle, 
  Clock, 
  SlidersHorizontal, 
  RefreshCw, 
  Eye, 
  User as UserIcon, 
  Calendar, 
  FileText, 
  Database, 
  Layers, 
  X, 
  Plus, 
  ChevronRight, 
  ArrowRight, 
  ListFilter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const { 
    activityLogs, 
    logActivity, 
    tools, 
    machines, 
    currentUser, 
    activeRole, 
    setSelectedToolForDrawer, 
    showToast 
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Modal State
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<ActivityLog | null>(null);
  const [showManualNoteModal, setShowManualNoteModal] = useState(false);
  const [manualNote, setManualNote] = useState({
    targetToolId: '',
    actionCategory: 'tooling' as 'tooling' | 'consumption' | 'override' | 'admin',
    summary: '',
    reason: '',
    severity: 'info' as ActivitySeverity
  });

  // KPI Calculations
  const totalEvents = activityLogs.length;
  const toolRegistrations = activityLogs.filter(l => l.actionType === 'tool_registration' || l.actionType === 'tool_replacement').length;
  const overridesAndCorrections = activityLogs.filter(l => l.actionType === 'admin_override' || l.actionType === 'consumption_correction' || l.actionType === 'bulk_zero').length;
  const uniqueUsersCount = new Set(activityLogs.map(l => l.userId)).size;

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      // 1. Text search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery = 
          log.id.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.targetEntityId.toLowerCase().includes(q) ||
          log.summary.toLowerCase().includes(q) ||
          (log.reason && log.reason.toLowerCase().includes(q)) ||
          (log.workstation && log.workstation.toLowerCase().includes(q)) ||
          (log.details?.machineCode && log.details.machineCode.toLowerCase().includes(q)) ||
          (log.details?.toolName && log.details.toolName.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // 2. Action Type
      if (selectedActionType !== 'all' && log.actionType !== selectedActionType) {
        return false;
      }

      // 3. Role
      if (selectedRole !== 'all' && log.userRole !== selectedRole) {
        return false;
      }

      // 4. Severity
      if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) {
        return false;
      }

      // 5. Time Horizon
      if (selectedTimeHorizon !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date('2026-10-21T13:00:00Z'); // Current simulation anchor
        const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);

        if (selectedTimeHorizon === 'today' && diffHours > 24) return false;
        if (selectedTimeHorizon === '7days' && diffHours > 24 * 7) return false;
        if (selectedTimeHorizon === '30days' && diffHours > 24 * 30) return false;
      }

      return true;
    });
  }, [activityLogs, searchQuery, selectedActionType, selectedRole, selectedSeverity, selectedTimeHorizon]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Action Type',
      'Category',
      'Severity',
      'User Name',
      'User Role',
      'User ID',
      'Workstation',
      'Target Entity ID',
      'Summary',
      'Reason',
      'Previous Value',
      'New Value',
      'Delta'
    ];

    const rows = filteredLogs.map(l => [
      l.id,
      `"${new Date(l.timestamp).toLocaleString()}"`,
      l.actionLabel,
      l.category,
      l.severity,
      `"${l.userName}"`,
      l.userRole,
      l.userId,
      l.workstation || 'N/A',
      l.targetEntityId,
      `"${l.summary.replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      l.details?.previousValue ?? '',
      l.details?.newValue ?? '',
      l.details?.delta ?? ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rosenberger_Activity_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredLogs.length} audit records to CSV`, 'success');
  };

  // Manual Note Submission
  const handleCreateManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.summary.trim()) {
      showToast('Please enter an audit summary', 'warning');
      return;
    }

    logActivity({
      actionType: 'master_data_update',
      actionLabel: 'Manual Audit Sign-Off',
      category: manualNote.actionCategory,
      severity: manualNote.severity,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      workstation: 'AUDIT-DESK-01',
      targetEntityId: manualNote.targetToolId ? manualNote.targetToolId.trim() : 'PLANT-FLOOR',
      targetEntityType: manualNote.targetToolId ? 'tool' : 'system',
      summary: manualNote.summary.trim(),
      reason: manualNote.reason.trim() || 'Manual supervisor/admin quality walkthrough note',
      details: {
        toolId: manualNote.targetToolId || undefined,
        meta: { signedBy: currentUser.name, role: activeRole }
      }
    });

    showToast('Manual audit entry logged successfully', 'success');
    setShowManualNoteModal(false);
    setManualNote({
      targetToolId: '',
      actionCategory: 'tooling',
      summary: '',
      reason: '',
      severity: 'info'
    });
  };

  // Helper for action badges
  const getActionBadge = (actionType: ActivityActionType) => {
    switch (actionType) {
      case 'tool_registration':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Plus className="w-3 h-3" />
            <span>Registration</span>
          </span>
        );
      case 'admin_override':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Admin Override</span>
          </span>
        );
      case 'consumption_correction':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3 h-3" />
            <span>Correction</span>
          </span>
        );
      case 'tool_replacement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <RefreshCw className="w-3 h-3" />
            <span>Replacement</span>
          </span>
        );
      case 'missed_resolution':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3" />
            <span>Missed Entry</span>
          </span>
        );
      case 'bulk_zero':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Layers className="w-3 h-3" />
            <span>Bulk Zero</span>
          </span>
        );
      case 'shift_consumption':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Shift Entry</span>
          </span>
        );
      case 'master_data_update':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Database className="w-3 h-3 text-slate-500" />
            <span>Master Data</span>
          </span>
        );
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">Admin</span>;
      case 'supervisor':
        return <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">Supervisor</span>;
      case 'setter':
        return <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">Setter</span>;
      case 'operator':
        return <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">Operator</span>;
    }
  };

  const getSeverityDot = (severity: ActivitySeverity) => {
    switch (severity) {
      case 'critical':
        return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Critical Action" />;
      case 'warning':
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Adjustment / Warning" />;
      case 'success':
        return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Success" />;
      case 'info':
      default:
        return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Standard Record" />;
    }
  };

  // Format timestamp nicely
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        dateStr: date.toISOString().split('T')[0],
        timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        full: date.toLocaleString()
      };
    } catch {
      return { dateStr: isoString, timeStr: '', full: isoString };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Plant Audit & Traceability Log</span>
            </span>
            <span className="text-xs text-slate-500">· ISO 9001 / IATF 16949 Compliant</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Historical User Activity & Ledger
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Complete sequential trail of user actions across all production lines: tool registrations, 
            supervisor consumption corrections, admin stroke overrides, and replacement events.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-md border border-slate-200 flex items-center text-xs font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded transition-colors ${
                viewMode === 'timeline' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline View
            </button>
          </div>

          {/* Add Manual Audit Note */}
          <button
            onClick={() => setShowManualNoteModal(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Log Audit Note</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Audit Events</span>
            <span className="p-1.5 rounded bg-blue-50 text-blue-600">
              <History className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{totalEvents}</span>
            <span className="text-xs text-slate-500">actions captured</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Full un-tampered plant audit history
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Overrides & Corrections</span>
            <span className="p-1.5 rounded bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700">{overridesAndCorrections}</span>
            <span className="text-xs text-slate-500">modifications</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-600">
            Requires signed justification
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lifecycle Operations</span>
            <span className="p-1.5 rounded bg-emerald-50 text-emerald-600">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">{toolRegistrations}</span>
            <span className="text-xs text-slate-500">tool onboard / swap</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Commissioning & replacements
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Audit Actors</span>
            <span className="p-1.5 rounded bg-indigo-50 text-indigo-600">
              <UserIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{uniqueUsersCount}</span>
            <span className="text-xs text-slate-500">distinct users</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Operators, Setters, Supervisors, Admins
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by User, Tool ID, Machine, Reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Action Type */}
          <div>
            <select
              value={selectedActionType}
              onChange={e => setSelectedActionType(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Action Types</option>
              <option value="tool_registration">Tool Registrations</option>
              <option value="admin_override">Admin Stroke Overrides</option>
              <option value="consumption_correction">Consumption Corrections</option>
              <option value="tool_replacement">Tool Replacements</option>
              <option value="missed_resolution">Missed Shift Resolutions</option>
              <option value="bulk_zero">Bulk Zero Operations</option>
              <option value="shift_consumption">Shift Consumption Entries</option>
              <option value="master_data_update">Master Data Updates</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All User Roles</option>
              <option value="admin">Administrator</option>
              <option value="supervisor">Shift Supervisor</option>
              <option value="setter">Tool Setter</option>
              <option value="operator">Machine Operator</option>
            </select>
          </div>

          {/* Time Horizon Filter */}
          <div>
            <select
              value={selectedTimeHorizon}
              onChange={e => setSelectedTimeHorizon(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Time History</option>
              <option value="today">Today (Past 24 Hours)</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800 font-mono">{filteredLogs.length}</strong> of{' '}
            <span className="font-mono">{activityLogs.length}</span> activity records
          </div>
          {(searchQuery || selectedActionType !== 'all' || selectedRole !== 'all' || selectedSeverity !== 'all' || selectedTimeHorizon !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedActionType('all');
                setSelectedRole('all');
                setSelectedSeverity('all');
                setSelectedTimeHorizon('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Timeline */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider select-none">
                <tr>
                  <th className="px-4 py-3">Event ID & Time</th>
                  <th className="px-3 py-3">User / Actor</th>
                  <th className="px-3 py-3">Action Type</th>
                  <th className="px-3 py-3">Target Entity</th>
                  <th className="px-4 py-3">Summary & Metrics</th>
                  <th className="px-4 py-3">Justification / Reason</th>
                  <th className="px-3 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No activity logs match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const time = formatTime(log.timestamp);
                    const isTool = log.targetEntityType === 'tool';
                    const targetTool = isTool ? tools.find(t => t.id === log.targetEntityId) : null;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedLogForDetails(log)}
                      >
                        {/* Event ID & Timestamp */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {getSeverityDot(log.severity)}
                            <span className="font-mono font-bold text-blue-700 text-xs">{log.id}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {time.dateStr} <span className="text-slate-400">· {time.timeStr}</span>
                          </div>
                        </td>

                        {/* User / Actor */}
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                              {log.userName.charAt(0)}
                            </span>
                            <span>{log.userName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getRoleBadge(log.userRole)}
                            <span className="text-[10px] font-mono text-slate-400">{log.userId}</span>
                          </div>
                        </td>

                        {/* Action Type */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {getActionBadge(log.actionType)}
                          {log.workstation && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                              {log.workstation}
                            </div>
                          )}
                        </td>

                        {/* Target Entity */}
                        <td className="px-3 py-3">
                          {isTool ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (targetTool) {
                                  setSelectedToolForDrawer(targetTool);
                                } else {
                                  // Find tool even if replaced
                                  const found = tools.find(t => t.id === log.targetEntityId);
                                  if (found) setSelectedToolForDrawer(found);
                                  else showToast(`Tool ${log.targetEntityId} record loaded`, 'info');
                                }
                              }}
                              className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Inspect tool master details"
                            >
                              <span>{log.targetEntityId}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          ) : (
                            <div className="font-mono font-semibold text-slate-800">
                              {log.targetEntityId}
                            </div>
                          )}
                          {log.details?.machineCode && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {log.details.machineCode}
                            </div>
                          )}
                        </td>

                        {/* Summary & Value Delta */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-slate-900 font-medium text-xs leading-snug">
                            {log.summary}
                          </div>
                          {log.details && (log.details.previousValue !== undefined || log.details.newValue !== undefined) && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
                              <span className="text-slate-400 line-through">
                                {typeof log.details.previousValue === 'number' 
                                  ? log.details.previousValue.toLocaleString() 
                                  : log.details.previousValue}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="font-bold text-slate-800">
                                {typeof log.details.newValue === 'number' 
                                  ? log.details.newValue.toLocaleString() 
                                  : log.details.newValue}
                              </span>
                              {log.details.delta !== undefined && log.details.delta !== 0 && (
                                <span className={`text-[10px] font-bold px-1 rounded ${
                                  log.details.delta > 0 
                                    ? 'bg-rose-50 text-rose-700' 
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {log.details.delta > 0 ? `+${log.details.delta.toLocaleString()}` : log.details.delta.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Justification / Reason */}
                        <td className="px-4 py-3 max-w-sm">
                          {log.reason ? (
                            <div className="text-slate-600 text-xs italic line-clamp-2" title={log.reason}>
                              "{log.reason}"
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Standard operational procedure</span>
                          )}
                        </td>

                        {/* Details Action Button */}
                        <td className="px-3 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLogForDetails(log)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Inspect full audit record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 space-y-8">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No activity logs match the selected filters.
              </div>
            ) : (
              filteredLogs.map(log => {
                const time = formatTime(log.timestamp);
                const isTool = log.targetEntityType === 'tool';
                const targetTool = isTool ? tools.find(t => t.id === log.targetEntityId) : null;

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-6 top-1 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-600 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition-colors shadow-2xs">
                      {log.actionType === 'tool_registration' && <Plus className="w-3 h-3 text-emerald-600" />}
                      {log.actionType === 'admin_override' && <SlidersHorizontal className="w-3 h-3 text-amber-600" />}
                      {log.actionType === 'consumption_correction' && <CheckCircle className="w-3 h-3 text-blue-600" />}
                      {log.actionType === 'tool_replacement' && <RefreshCw className="w-3 h-3 text-rose-600" />}
                      {log.actionType === 'missed_resolution' && <Clock className="w-3 h-3 text-indigo-600" />}
                      {log.actionType === 'bulk_zero' && <Layers className="w-3 h-3 text-purple-600" />}
                      {log.actionType === 'shift_consumption' && <Clock className="w-3 h-3 text-slate-500" />}
                      {log.actionType === 'master_data_update' && <Database className="w-3 h-3 text-slate-500" />}
                    </div>

                    {/* Timeline Card */}
                    <div 
                      onClick={() => setSelectedLogForDetails(log)}
                      className="ml-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-lg p-4 transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          {getActionBadge(log.actionType)}
                          <span className="font-mono font-bold text-xs text-blue-700">{log.id}</span>
                          <span className="text-slate-300">·</span>
                          <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                            <span>{log.userName}</span>
                            {getRoleBadge(log.userRole)}
                          </div>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400">
                          {time.full}
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <div className="text-sm font-semibold text-slate-900">
                          {log.summary}
                        </div>

                        {log.reason && (
                          <div className="mt-1 text-xs text-slate-600 italic bg-white/70 p-2 rounded border border-slate-200/60">
                            <strong>Justification:</strong> {log.reason}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-slate-400">Target:</span>
                            {isTool ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (targetTool) setSelectedToolForDrawer(targetTool);
                                }}
                                className="font-bold text-blue-600 hover:underline"
                              >
                                {log.targetEntityId}
                              </button>
                            ) : (
                              <span className="font-bold text-slate-800">{log.targetEntityId}</span>
                            )}
                          </div>

                          {log.details?.machineCode && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <span className="text-slate-400">Machine:</span>
                              <span className="font-semibold text-slate-800">{log.details.machineCode}</span>
                            </div>
                          )}

                          {log.workstation && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <span className="text-slate-400">Station:</span>
                              <span>{log.workstation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-blue-300">
                    Audit Record: {selectedLogForDetails.id}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {selectedLogForDetails.actionLabel}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {/* Top Meta Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Timestamp</span>
                  <div className="font-mono text-slate-900 font-semibold mt-0.5">
                    {formatTime(selectedLogForDetails.timestamp).full}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">User Actor</span>
                  <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                    <span>{selectedLogForDetails.userName}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {selectedLogForDetails.userId} ({selectedLogForDetails.userRole})
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Workstation</span>
                  <div className="font-mono text-slate-800 font-semibold mt-0.5">
                    {selectedLogForDetails.workstation || 'Terminal 01'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                  <div className="mt-0.5">
                    {getActionBadge(selectedLogForDetails.actionType)}
                  </div>
                </div>
              </div>

              {/* Action Summary */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Event Summary
                </label>
                <div className="p-3 bg-white border border-slate-200 rounded-md text-slate-900 font-medium">
                  {selectedLogForDetails.summary}
                </div>
              </div>

              {/* Justification Reason */}
              {selectedLogForDetails.reason && (
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Logged Justification / Remark
                  </label>
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-md text-amber-900 italic font-sans">
                    "{selectedLogForDetails.reason}"
                  </div>
                </div>
              )}

              {/* Parameter Deltas */}
              {selectedLogForDetails.details && (
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Recorded Parameters & Lifecycle Data
                  </label>
                  <div className="bg-slate-900 text-slate-200 p-3.5 rounded-md font-mono text-xs overflow-x-auto space-y-1.5">
                    {selectedLogForDetails.details.toolId && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Target Tool ID:</span>
                        <span className="text-blue-400 font-bold">{selectedLogForDetails.details.toolId}</span>
                      </div>
                    )}
                    {selectedLogForDetails.details.toolName && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Tool Name:</span>
                        <span className="text-white truncate max-w-xs">{selectedLogForDetails.details.toolName}</span>
                      </div>
                    )}
                    {selectedLogForDetails.details.machineCode && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Machine Code:</span>
                        <span className="text-emerald-400">{selectedLogForDetails.details.machineCode}</span>
                      </div>
                    )}
                    {selectedLogForDetails.details.previousValue !== undefined && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Baseline / Previous:</span>
                        <span className="text-amber-400">
                          {typeof selectedLogForDetails.details.previousValue === 'number'
                            ? selectedLogForDetails.details.previousValue.toLocaleString()
                            : selectedLogForDetails.details.previousValue}
                        </span>
                      </div>
                    )}
                    {selectedLogForDetails.details.newValue !== undefined && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Updated Value:</span>
                        <span className="text-emerald-400 font-bold">
                          {typeof selectedLogForDetails.details.newValue === 'number'
                            ? selectedLogForDetails.details.newValue.toLocaleString()
                            : selectedLogForDetails.details.newValue}
                        </span>
                      </div>
                    )}
                    {selectedLogForDetails.details.delta !== undefined && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Net Delta:</span>
                        <span className="text-white font-bold">
                          {selectedLogForDetails.details.delta > 0 
                            ? `+${selectedLogForDetails.details.delta.toLocaleString()}` 
                            : selectedLogForDetails.details.delta.toLocaleString()} strokes
                        </span>
                      </div>
                    )}
                    {selectedLogForDetails.details.replacedToolId && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Replaced Tool:</span>
                        <span className="text-rose-400 line-through">{selectedLogForDetails.details.replacedToolId}</span>
                      </div>
                    )}
                    {selectedLogForDetails.details.newToolId && (
                      <div className="flex justify-between border-b border-slate-800 pb-1">
                        <span className="text-slate-400">Replacement Tool:</span>
                        <span className="text-emerald-400 font-bold">{selectedLogForDetails.details.newToolId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality Compliance Footnote */}
              <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-md text-[11px] text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ISO 9001:2015 & IATF 16949 §7.5.3 Compliance:</strong> This audit event record is immutable, timestamped, and retained indefinitely for customer PPAP audits and tooling lifetime traceability.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                {selectedLogForDetails.targetEntityType === 'tool' && (
                  <button
                    onClick={() => {
                      const t = tools.find(item => item.id === selectedLogForDetails.targetEntityId);
                      if (t) {
                        setSelectedToolForDrawer(t);
                        setSelectedLogForDetails(null);
                      } else {
                        showToast(`Tool ${selectedLogForDetails.targetEntityId} not currently mounted`, 'info');
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Tool Ledger Drawer</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Audit Note Modal */}
      {showManualNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0A192F] text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Record Manual Plant Audit Note</h3>
              </div>
              <button
                onClick={() => setShowManualNoteModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualNote} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Target Tool Identifier (Optional)
                </label>
                <select
                  value={manualNote.targetToolId}
                  onChange={e => setManualNote({ ...manualNote, targetToolId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- General Plant Line / Unassociated --</option>
                  {tools.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.itemName} ({t.primaryMachineId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Audit Category & Severity
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={manualNote.actionCategory}
                    onChange={e => setManualNote({ ...manualNote, actionCategory: e.target.value as any })}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="tooling">Tooling & Maintenance</option>
                    <option value="consumption">Shift Consumption</option>
                    <option value="override">System Override</option>
                    <option value="admin">Quality Administration</option>
                  </select>

                  <select
                    value={manualNote.severity}
                    onChange={e => setManualNote({ ...manualNote, severity: e.target.value as any })}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="info">Info / Routine Audit</option>
                    <option value="warning">Warning / Deviation</option>
                    <option value="critical">Critical / Tool Stop</option>
                    <option value="success">Success / Sign-Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Audit Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visual die face inspection completed, micro-wear within tolerance"
                  value={manualNote.summary}
                  onChange={e => setManualNote({ ...manualNote, summary: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason & Regulatory Findings
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Conducted during scheduled Shift 1 die maintenance walkthrough by quality supervisor..."
                  value={manualNote.reason}
                  onChange={e => setManualNote({ ...manualNote, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualNoteModal(false)}
                  className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Sign & Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
