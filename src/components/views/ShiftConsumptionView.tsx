import React, { useState, useMemo } from 'react';
import { useApp, calculateLifespanCondition } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  ClipboardCheck, 
  Check, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Wrench, 
  User as UserIcon, 
  Calendar, 
  RotateCcw,
  History,
  CheckCircle2
} from 'lucide-react';

export const ShiftConsumptionView: React.FC = () => {
  const { 
    machines, 
    tools, 
    shifts, 
    currentUser, 
    activeRole, 
    recordConsumption, 
    consumptions,
    showToast 
  } = useApp();

  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [productionDate, setProductionDate] = useState<string>('2026-10-21');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id || '');
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [consumptionQty, setConsumptionQty] = useState<number | ''>(1200);
  const [entryReason, setEntryReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available tools for selected machine
  const machineTools = useMemo(() => {
    return tools.filter(t => t.primaryMachineId === selectedMachineId && t.status === 'active');
  }, [tools, selectedMachineId]);

  // Set default tool if not selected or invalid for machine
  React.useEffect(() => {
    if (machineTools.length > 0) {
      if (!selectedToolId || !machineTools.some(t => t.id === selectedToolId)) {
        setSelectedToolId(machineTools[0].id);
      }
    } else {
      setSelectedToolId('');
    }
  }, [machineTools, selectedToolId]);

  const selectedTool = tools.find(t => t.id === selectedToolId);
  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const selectedShift = shifts.find(s => s.id === selectedShiftId);

  // Math previews
  const qtyNum = typeof consumptionQty === 'number' ? consumptionQty : 0;
  const previousRemaining = selectedTool ? selectedTool.remainingLifespan : 0;
  const newRemaining = Math.max(0, previousRemaining - qtyNum);
  const newCondition = selectedTool 
    ? calculateLifespanCondition(selectedTool.maxLifespan, newRemaining)
    : 'healthy';

  // Check for duplicate entry on same tool, date, shift
  const existingEntry = consumptions.find(
    c => c.toolId === selectedToolId && c.productionDate === productionDate && c.shiftId === selectedShiftId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolId) {
      showToast('Please select a valid tool mounted on the machine', 'error');
      return;
    }
    if (!consumptionQty || consumptionQty <= 0) {
      showToast('Please enter a positive consumption stroke count', 'error');
      return;
    }

    setIsSubmitting(true);
    const success = recordConsumption({
      toolId: selectedToolId,
      machineId: selectedMachineId,
      productionDate,
      shiftId: selectedShiftId,
      quantity: Number(consumptionQty),
      reason: entryReason.trim()
    });

    setIsSubmitting(false);

    if (success) {
      // Reset quantity or reason for next entry
      setEntryReason('');
      setConsumptionQty(1000);
    }
  };

  // Recent entries for this machine or user
  const recentEntries = consumptions.slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Operator Shift Handover Log
            </span>
            <span className="text-xs text-slate-500 font-mono">End-of-Shift Entry Standard</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shift-Wise Tool Consumption Entry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record actual stroke count produced during shift. Remaining tool lifespan recalculates automatically.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-700 shrink-0">
          <div>Operator: <strong className="text-slate-900">{currentUser.name}</strong></div>
          <div className="text-[11px] text-slate-500 font-sans">Role: {activeRole.toUpperCase()} · Terminal #04</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Entry Form (2 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                Shift Production Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select target machine cell and active production shift.
              </p>
            </div>

            {/* Row 1: Machine, Shift, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Production Machine <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMachineId}
                  onChange={e => setSelectedMachineId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name.split(' ')[0]} ({m.bay})
                    </option>
                  ))}
                </select>
                {selectedMachine && (
                  <span className="text-[10px] text-slate-500 mt-1 block truncate">
                    {selectedMachine.location}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Production Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={productionDate}
                  onChange={e => setProductionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Timing <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedShiftId}
                  onChange={e => setSelectedShiftId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Tool Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mounted Tool on {selectedMachine?.code} <span className="text-rose-500">*</span>
              </label>

              {machineTools.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                  No active tools currently mounted on {selectedMachine?.code}. You can associate tools via Tool Registration.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {machineTools.map(t => {
                    const isSelected = t.id === selectedToolId;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedToolId(t.id)}
                        className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">{t.id}</span>
                          <StatusBadge condition={t.lifespanCondition} />
                        </div>
                        <div className="text-xs font-medium text-slate-800 truncate mt-1">{t.itemName}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1 flex justify-between">
                          <span>Rem: {t.remainingLifespan.toLocaleString()}</span>
                          <span>Max: {t.maxLifespan.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 3: Consumption Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Consumption (Net Strokes / Cycles) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1500"
                    value={consumptionQty}
                    onChange={e => setConsumptionQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-3 top-3 text-[11px] text-slate-400 uppercase font-mono">
                    Strokes
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Verify machine counter or stroke sensor reading before saving.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Notes / Batch Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lot #9901-B, Good batch run"
                  value={entryReason}
                  onChange={e => setEntryReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Duplicate Notice */}
            {existingEntry && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-md flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Notice:</strong> An entry of{' '}
                  <span className="font-mono font-bold">{existingEntry.quantity.toLocaleString()} strokes</span> was
                  already submitted for this tool on {productionDate} ({selectedShift?.name}) by {existingEntry.userName}.
                  Submitting again will add to cumulative consumption. For corrections, use the Corrections module.
                </div>
              </div>
            )}

            {/* Excess warning */}
            {selectedTool && qtyNum > selectedTool.remainingLifespan && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-md flex items-start gap-2.5 text-xs text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Warning:</strong> Entered consumption ({qtyNum.toLocaleString()} strokes) exceeds tool's
                  remaining lifespan balance ({selectedTool.remainingLifespan.toLocaleString()} strokes). Remaining
                  balance will drop to 0 and tool must be replaced immediately.
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !selectedToolId || !consumptionQty}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Submit Shift Consumption</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Calculation Preview Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs sticky top-20">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Automatic Lifespan Calculation
            </div>

            {selectedTool ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Target Tool:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedTool.id}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Previous Remaining:</span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">
                      {previousRemaining.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-rose-600">
                    <span>Shift Consumption:</span>
                    <span className="font-mono font-bold tabular-nums">
                      − {qtyNum.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Resulting Remaining:</span>
                    <span className="font-mono font-bold text-base text-slate-900 tabular-nums">
                      {newRemaining.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Resulting Health Indicator */}
                <div className="p-3 rounded-md border flex items-center justify-between text-xs bg-white border-slate-200">
                  <span className="text-slate-600 font-medium">Post-Shift Health:</span>
                  <StatusBadge condition={newCondition} />
                </div>

                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  Formula mandated by Rosenberger TLMS Spec §2.2:
                  <div className="font-mono text-slate-700 font-semibold mt-1">
                    Remaining = Previous Remaining − Recorded Consumption
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Select a tool to preview lifespan calculations.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log / Recent Entries Feed */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Recent Shift Submissions Across Plant</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last {recentEntries.length} entries</span>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">Entry ID</th>
                <th className="px-3 py-2.5">Date / Shift</th>
                <th className="px-3 py-2.5">Machine & Tool</th>
                <th className="px-3 py-2.5 text-right">Strokes</th>
                <th className="px-3 py-2.5 text-right">Post Remaining</th>
                <th className="px-3 py-2.5">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {recentEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-medium">{entry.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{entry.productionDate}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{entry.shiftName}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-mono font-bold text-slate-900">{entry.toolId}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{entry.machineCode}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800 tabular-nums">
                    {entry.quantity.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600 tabular-nums">
                    {entry.newRemaining.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{entry.userName}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{entry.userRole}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
