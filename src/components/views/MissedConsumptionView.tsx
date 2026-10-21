import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { MissedEntryAlert, ConsumptionEntry } from '../../types';
import { 
  AlertCircle, 
  CheckCircle, 
  Edit3, 
  Clock, 
  UserCheck, 
  RotateCcw, 
  ShieldAlert, 
  History,
  Check,
  X,
  Plus
} from 'lucide-react';

export const MissedConsumptionView: React.FC = () => {
  const { 
    missedAlerts, 
    consumptions, 
    corrections, 
    machines, 
    tools, 
    shifts, 
    currentUser, 
    activeRole, 
    resolveMissedEntry, 
    correctConsumption,
    recordConsumption,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'missed' | 'manual_missed' | 'corrections'>('missed');

  // Modal states for resolving an alert
  const [resolvingAlert, setResolvingAlert] = useState<MissedEntryAlert | null>(null);
  const [resolveQty, setResolveQty] = useState<number | ''>(1250);
  const [resolveReason, setResolveReason] = useState<string>('Operator missed shift-end entry due to line handover delay');

  // State for correction modal
  const [correctingEntry, setCorrectingEntry] = useState<ConsumptionEntry | null>(null);
  const [correctedQty, setCorrectedQty] = useState<number | ''>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // State for manual supervisor missed entry
  const [manualMachineId, setManualMachineId] = useState<string>(machines[0]?.id || '');
  const [manualDate, setManualDate] = useState<string>('2026-10-20');
  const [manualShiftId, setManualShiftId] = useState<string>(shifts[0]?.id || '');
  const [manualToolId, setManualToolId] = useState<string>('');
  const [manualQty, setManualQty] = useState<number | ''>(1400);
  const [manualReason, setManualReason] = useState<string>('Logged by shift supervisor on operator behalf');

  const pendingAlerts = missedAlerts.filter(a => !a.isResolved);
  const resolvedAlerts = missedAlerts.filter(a => a.isResolved);

  // Tools for manual selection
  const manualTools = tools.filter(t => t.primaryMachineId === manualMachineId && t.status === 'active');
  React.useEffect(() => {
    if (manualTools.length > 0 && (!manualToolId || !manualTools.some(t => t.id === manualToolId))) {
      setManualToolId(manualTools[0].id);
    }
  }, [manualTools, manualToolId]);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert || !resolveQty || resolveQty <= 0) {
      showToast('Please enter valid consumption strokes', 'error');
      return;
    }

    const success = resolveMissedEntry(
      resolvingAlert.id,
      Number(resolveQty),
      resolveReason.trim()
    );

    if (success) {
      setResolvingAlert(null);
    }
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingEntry || correctedQty === '' || Number(correctedQty) < 0) {
      showToast('Please enter valid corrected quantity', 'error');
      return;
    }
    if (!correctionReason.trim()) {
      showToast('Correction reason is mandatory for audit compliance', 'error');
      return;
    }

    const success = correctConsumption({
      entryId: correctingEntry.id,
      correctedQuantity: Number(correctedQty),
      reason: correctionReason.trim()
    });

    if (success) {
      setCorrectingEntry(null);
      setCorrectionReason('');
    }
  };

  const handleManualMissedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToolId || !manualQty || manualQty <= 0) {
      showToast('Please complete all required fields', 'error');
      return;
    }

    const targetTool = tools.find(t => t.id === manualToolId);
    if (!targetTool) return;

    recordConsumption({
      toolId: manualToolId,
      machineId: manualMachineId,
      productionDate: manualDate,
      shiftId: manualShiftId,
      quantity: Number(manualQty),
      reason: `Supervisor Missed Entry: ${manualReason}`
    });

    showToast(`Supervisor captured missed shift entry for ${manualToolId}`, 'success');
    setManualQty(1000);
    setManualReason('');
    setActiveTab('missed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Supervisor Quality & Handover Governance
            </span>
            <span className="text-xs text-slate-500 font-mono">TLMS Compliance §2.4 & §2.5</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Missed Consumption & Corrections</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift Supervisor workflow for reconciling missed operator shift logs and auditing consumption corrections.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('missed')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'missed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Flagged Missed Shifts</span>
            {pendingAlerts.length > 0 && (
              <span className="font-mono text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                {pendingAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('manual_missed')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'manual_missed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manual Missed Entry
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'corrections'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Audit Corrections</span>
            <span className="font-mono text-[10px] text-slate-400">({corrections.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Pending Missed Entries */}
      {activeTab === 'missed' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Unresolved Missed Shift Logs</h2>
                <p className="text-xs text-slate-500">
                  Production machines that ran during the shift with no operator stroke entry submitted.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                {pendingAlerts.length} Pending Resolution
              </span>
            </div>

            {pendingAlerts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="font-semibold text-slate-800">All Shift Logs Are Reconciled</div>
                No pending missed consumption alerts for current factory production shifts.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                {pendingAlerts.map(alert => {
                  const targetTool = tools.find(t => t.id === alert.toolId);
                  return (
                    <div
                      key={alert.id}
                      className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {alert.machineCode}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-700">{alert.date}</span>
                          <span className="text-xs text-slate-500 font-medium">{alert.shiftName}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1">
                          Tool: <span className="font-mono text-blue-700">{alert.toolId}</span> · {alert.toolName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Assigned Operator: {alert.expectedOperatorName || 'Shift Operator'} · Current Remaining:{' '}
                          <span className="font-mono font-semibold text-slate-700">
                            {targetTool ? targetTool.remainingLifespan.toLocaleString() : '---'} strokes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => {
                            setResolvingAlert(alert);
                            setResolveQty(1200);
                          }}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Enter Missing Consumption</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Reconciled Missed Entries */}
          {resolvedAlerts.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Reconciled Missed Logs Archive</h2>
              <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Alert ID</th>
                      <th className="px-3 py-2">Machine & Tool</th>
                      <th className="px-3 py-2">Production Date / Shift</th>
                      <th className="px-3 py-2">Resolved By</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {resolvedAlerts.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-slate-600">{a.id}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono font-bold text-slate-800">{a.toolId}</span> on {a.machineCode}
                        </td>
                        <td className="px-3 py-2">{a.date} ({a.shiftName})</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{a.resolvedBy}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            Reconciled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manual Supervisor Missed Entry */}
      {activeTab === 'manual_missed' && (
        <form onSubmit={handleManualMissedSubmit} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 max-w-2xl">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Manual Missed Consumption Registration</h2>
            <p className="text-xs text-slate-500">
              Directly capture a missed shift entry on an operator's behalf for any production date and machine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Production Machine</label>
              <select
                value={manualMachineId}
                onChange={e => setManualMachineId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Production Date</label>
              <input
                type="date"
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift</label>
              <select
                value={manualShiftId}
                onChange={e => setManualShiftId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tool Mounted</label>
              <select
                value={manualToolId}
                onChange={e => setManualToolId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
              >
                {manualTools.map(t => (
                  <option key={t.id} value={t.id}>{t.id} - {t.itemName}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Consumption Quantity (Strokes)</label>
              <input
                type="number"
                min="1"
                value={manualQty}
                onChange={e => setManualQty(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Supervisor Justification / Reason</label>
              <input
                type="text"
                placeholder="e.g. Operator attended mandatory plant safety drill during shift end."
                value={manualReason}
                onChange={e => setManualReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Record Missed Consumption Entry</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Corrections & Audit Trail */}
      {activeTab === 'corrections' && (
        <div className="space-y-6">
          {/* History of corrections */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Historical Consumption Correction Audit</h2>
                <p className="text-xs text-slate-500">
                  Approved corrections to previously submitted shift records with original vs revised values and justification.
                </p>
              </div>
            </div>

            {corrections.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded border border-slate-200">
                No consumption corrections recorded yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Correction ID</th>
                      <th className="px-3 py-2">Original Entry</th>
                      <th className="px-3 py-2">Tool / Machine</th>
                      <th className="px-3 py-2 text-right">Original Qty</th>
                      <th className="px-3 py-2 text-right">Corrected Qty</th>
                      <th className="px-3 py-2 text-right">Lifespan Delta</th>
                      <th className="px-3 py-2">Reason & Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {corrections.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 font-sans">
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{c.id}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">{c.originalEntryId}</td>
                        <td className="px-3 py-2 font-mono">
                          <span className="font-bold text-blue-700">{c.toolId}</span> ({c.machineId})
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-500 line-through">
                          {c.originalQuantity.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums font-bold text-slate-900">
                          {c.correctedQuantity.toLocaleString()}
                        </td>
                        <td className={`px-3 py-2 text-right font-mono tabular-nums font-bold ${
                          c.delta > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {c.delta > 0 ? `+${c.delta.toLocaleString()}` : c.delta.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-[11px]">
                          <div className="text-slate-800 italic">"{c.reason}"</div>
                          <div className="text-slate-500 font-mono mt-0.5">Approved: {c.approvedBy}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Select Entry to Correct */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Select an Existing Entry to Apply Correction</h2>
            <p className="text-xs text-slate-500 mb-3">
              If an operator entered an incorrect stroke quantity, select the record below to update it.
            </p>

            <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Entry ID</th>
                    <th className="px-3 py-2">Date / Shift</th>
                    <th className="px-3 py-2">Tool ID</th>
                    <th className="px-3 py-2">Machine</th>
                    <th className="px-3 py-2 text-right">Current Qty</th>
                    <th className="px-3 py-2">Recorded By</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {consumptions.slice(0, 8).map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-blue-700">{entry.id}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {entry.productionDate} ({entry.shiftName.split(' ')[0]})
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{entry.toolId}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{entry.machineCode}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-900">
                        {entry.quantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{entry.userName}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => {
                            setCorrectingEntry(entry);
                            setCorrectedQty(entry.quantity);
                            setCorrectionReason('');
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resolve Missed Entry */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleResolveSubmit}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Missed Consumption</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Shift Supervisor Override for Alert {resolvingAlert.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResolvingAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
              <div><strong>Machine:</strong> {resolvingAlert.machineCode}</div>
              <div><strong>Production Date & Shift:</strong> {resolvingAlert.date} · {resolvingAlert.shiftName}</div>
              <div><strong>Tool:</strong> {resolvingAlert.toolId} - {resolvingAlert.toolName}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actual Consumption Quantity (Strokes) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={resolveQty}
                  onChange={e => setResolveQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supervisor Reason for Missed Entry <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={resolveReason}
                  onChange={e => setResolveReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolvingAlert(null)}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Supervisor Entry</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Correct Consumption */}
      {correctingEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCorrectionSubmit}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Correct Consumption Entry</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Modifying record {correctingEntry.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCorrectingEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
              <div><strong>Tool:</strong> {correctingEntry.toolId} · {correctingEntry.toolName}</div>
              <div><strong>Machine:</strong> {correctingEntry.machineCode}</div>
              <div><strong>Date & Shift:</strong> {correctingEntry.productionDate} · {correctingEntry.shiftName}</div>
              <div><strong>Original Recorded Qty:</strong> <span className="font-mono font-bold">{correctingEntry.quantity.toLocaleString()} strokes</span></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Revised Correct Quantity (Strokes) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={correctedQty}
                  onChange={e => setCorrectedQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-sm"
                />
                {correctedQty !== '' && (
                  <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                    Adjustment Delta: {Number(correctedQty) - correctingEntry.quantity > 0 ? `+${Number(correctedQty) - correctingEntry.quantity}` : Number(correctedQty) - correctingEntry.quantity} strokes
                  </span>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Correction (Audit Log Requirement) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Counter recount showed 1,400 parts instead of 1,800 due to scrap parts subtraction."
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCorrectingEntry(null)}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Correction & Recalculate Lifespan</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
