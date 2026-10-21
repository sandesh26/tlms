import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { Tool, Machine, ToolReplacementPayload } from '../../types';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  Calendar, 
  Layers, 
  Wrench, 
  CheckSquare, 
  Square,
  ShieldCheck,
  History,
  X
} from 'lucide-react';

export const AdminToolManagementView: React.FC = () => {
  const { 
    tools, 
    machines, 
    shifts, 
    applyBulkZeroConsumption, 
    replaceTool, 
    applyAdminOverride, 
    consumptions, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'replacement' | 'bulk_zero' | 'override'>('replacement');

  // Tool replacement modal & state
  const [replacingTool, setReplacingTool] = useState<Tool | null>(null);
  const [replacementToolId, setReplacementToolId] = useState('');
  const [replacementMaxLifespan, setReplacementMaxLifespan] = useState<number | ''>(100000);
  const [replacementReason, setReplacementReason] = useState('Tool lifespan reached 100% threshold. Normal wear out replacement.');
  const [isReplacing, setIsReplacing] = useState(false);

  // Bulk zero-consumption state
  const [bulkDate, setBulkDate] = useState('2026-10-18'); // Sunday
  const [selectedBulkToolIds, setSelectedBulkToolIds] = useState<string[]>([]);
  const [bulkOverrideType, setBulkOverrideType] = useState<'zero_consumption' | 'common_value'>('zero_consumption');
  const [commonValue, setCommonValue] = useState<number>(0);
  const [bulkReason, setBulkReason] = useState('Sunday plant shutdown - line maintenance day');
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  // Single Admin Override state
  const [overrideToolId, setOverrideToolId] = useState<string>(tools[0]?.id || '');
  const [overrideDate, setOverrideDate] = useState<string>('2026-10-21');
  const [overrideShiftId, setOverrideShiftId] = useState<string>(shifts[0]?.id || '');
  const [overrideQty, setOverrideQty] = useState<number | ''>(1500);
  const [overrideReason, setOverrideReason] = useState<string>('Administrative recalibration from quality audit');

  const activeTools = tools.filter(t => t.status === 'active');
  const criticalTools = activeTools.filter(t => t.lifespanCondition === 'critical');
  const replacedTools = tools.filter(t => t.status === 'replaced');

  // Select all tools helper for bulk
  const handleToggleSelectAll = () => {
    if (selectedBulkToolIds.length === activeTools.length) {
      setSelectedBulkToolIds([]);
    } else {
      setSelectedBulkToolIds(activeTools.map(t => t.id));
    }
  };

  const handleToggleToolSelection = (id: string) => {
    setSelectedBulkToolIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Execute Tool Replacement
  const handleReplacementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingTool || !replacementToolId.trim()) {
      showToast('Please enter a new tool identifier', 'error');
      return;
    }

    setIsReplacing(true);
    const success = replaceTool({
      oldToolId: replacingTool.id,
      newToolId: replacementToolId.trim().toUpperCase(),
      productCode: replacingTool.productCode,
      itemName: replacingTool.itemName,
      description: replacingTool.description,
      recipeNumber: replacingTool.recipeNumber,
      toolCost: replacingTool.toolCost,
      machineId: replacingTool.primaryMachineId,
      maxLifespan: Number(replacementMaxLifespan) || replacingTool.maxLifespan,
      reason: replacementReason.trim()
    });

    setIsReplacing(false);
    if (success) {
      setReplacingTool(null);
      setReplacementToolId('');
    }
  };

  // Execute Bulk Zero / Common Value
  const handleExecuteBulk = () => {
    if (selectedBulkToolIds.length === 0) {
      showToast('Please select at least one tool', 'error');
      return;
    }

    applyBulkZeroConsumption({
      productionDate: bulkDate,
      toolIds: selectedBulkToolIds,
      overrideType: bulkOverrideType,
      commonValue: bulkOverrideType === 'common_value' ? Number(commonValue) : 0,
      reason: bulkReason.trim()
    });

    setShowBulkConfirmModal(false);
    setSelectedBulkToolIds([]);
  };

  // Execute Single Admin Override
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetTool = tools.find(t => t.id === overrideToolId);
    if (!targetTool) return;

    if (overrideQty === '' || Number(overrideQty) < 0) {
      showToast('Please enter valid consumption quantity', 'error');
      return;
    }

    applyAdminOverride({
      toolId: overrideToolId,
      machineId: targetTool.primaryMachineId,
      productionDate: overrideDate,
      shiftId: overrideShiftId,
      quantity: Number(overrideQty),
      reason: overrideReason.trim()
    });

    setOverrideQty(1000);
    setOverrideReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Administrator Authorized Controls
            </span>
            <span className="text-xs text-slate-500 font-mono">TLMS §3 Admin Override & Lifespan Baseline</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Tool Management & Overrides</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage tool replacement lifecycle, bulk zero-consumption updates for Sundays/maintenance, and administrative ledger overrides.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('replacement')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'replacement'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Tool Replacement</span>
            {criticalTools.length > 0 && (
              <span className="font-mono text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                {criticalTools.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bulk_zero')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'bulk_zero'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>Bulk Zero-Consumption</span>
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'override'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Single Admin Override</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Tool Replacement Workflow */}
      {activeTab === 'replacement' && (
        <div className="space-y-6">
          {/* Critical Tools Awaiting Replacement */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Exhausted / Critical Tools Ready for Replacement</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Replacing archives the exhausted tool record with its full consumption history, and mounts a fresh replacement tool with reset 0-consumption counter.
                </p>
              </div>
            </div>

            {criticalTools.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                No tools currently in critical replacement state. All active tools maintain safe lifespan margins.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden text-xs">
                {criticalTools.map(t => {
                  const percentUsed = Math.round((t.consumedLifespan / t.maxLifespan) * 100);
                  return (
                    <div
                      key={t.id}
                      className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {t.id}
                          </span>
                          <StatusBadge condition={t.lifespanCondition} />
                          <span className="font-mono text-slate-500">Machine: {t.primaryMachineId}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{t.itemName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Recipe: {t.recipeNumber} · Cost: ₹{t.toolCost.toLocaleString()} · Max: {t.maxLifespan.toLocaleString()} strokes
                        </div>
                        <div className="text-xs text-rose-700 font-medium font-mono mt-1">
                          Consumed: {t.consumedLifespan.toLocaleString()} ({percentUsed}%) · Remaining:{' '}
                          <strong>{t.remainingLifespan.toLocaleString()} strokes</strong>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => {
                            setReplacingTool(t);
                            // Generate suggested replacement ID (e.g. TL-CR-4030)
                            const prefix = t.id.split('-').slice(0, 2).join('-');
                            const num = parseInt(t.id.split('-')[2] || '1000', 10);
                            setReplacementToolId(`${prefix}-${num + 1}`);
                            setReplacementMaxLifespan(t.maxLifespan);
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                          <span>Execute Tool Replacement</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Replacements Registry */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Historical Tool Replacement Registry</h2>
                <p className="text-xs text-slate-500">
                  Decommissioned tools retained for ISO-9001 quality audits with lineage to active replacement tools.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">{replacedTools.length} Archived</span>
            </div>

            {replacedTools.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded border border-slate-200">
                No past replacements recorded yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Decommissioned Tool</th>
                      <th className="px-3 py-2">Successor Tool</th>
                      <th className="px-3 py-2">Machine Association</th>
                      <th className="px-3 py-2 text-right">Lifetime Strokes</th>
                      <th className="px-3 py-2">Replacement Date</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {replacedTools.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{t.id}</td>
                        <td className="px-3 py-2 font-mono font-bold text-blue-700">
                          {t.replacedByToolId || '---'}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">{t.primaryMachineId}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900 font-bold">
                          {t.consumedLifespan.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">{t.replacementDate || '2026-04-18'}</td>
                        <td className="px-3 py-2 text-slate-600 text-[11px] truncate max-w-xs">{t.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Bulk Zero-Consumption Management */}
      {activeTab === 'bulk_zero' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bulk Zero-Consumption & Sunday Operations</h2>
              <p className="text-xs text-slate-500">
                Mandated by Rosenberger TLMS Spec §2.6 & §3.2: Configure non-working Sunday shutdowns or batch production values across multiple tools simultaneously.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Production Date</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={e => setBulkDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operation Mode</label>
                <select
                  value={bulkOverrideType}
                  onChange={e => setBulkOverrideType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium"
                >
                  <option value="zero_consumption">Mark Zero Consumption (0 Strokes - Plant Idle/Sunday)</option>
                  <option value="common_value">Apply Common Stroke Quantity across Selected Tools</option>
                </select>
              </div>

              {bulkOverrideType === 'common_value' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Common Quantity (Strokes)</label>
                  <input
                    type="number"
                    min="1"
                    value={commonValue}
                    onChange={e => setCommonValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold"
                  />
                </div>
              )}

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Audit Justification</label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={e => setBulkReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            {/* Tool Selection Table */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {selectedBulkToolIds.length === activeTools.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {selectedBulkToolIds.length === activeTools.length ? 'Deselect All' : 'Select All Active Tools'}
                    </span>
                  </button>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500 font-mono">
                    {selectedBulkToolIds.length} of {activeTools.length} selected
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden max-h-72 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-8"></th>
                      <th className="px-3 py-2">Tool ID</th>
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2">Machine</th>
                      <th className="px-3 py-2 text-right">Current Remaining</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {activeTools.map(t => {
                      const isSelected = selectedBulkToolIds.includes(t.id);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => handleToggleToolSelection(t.id)}
                          className={`hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900">{t.id}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{t.itemName}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{t.primaryMachineId}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {t.remainingLifespan.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <StatusBadge condition={t.lifespanCondition} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={selectedBulkToolIds.length === 0}
                onClick={() => setShowBulkConfirmModal(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Review & Apply Bulk Update ({selectedBulkToolIds.length} Tools)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Single Admin Override */}
      {activeTab === 'override' && (
        <form onSubmit={handleOverrideSubmit} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 max-w-2xl">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Administrative Consumption Override</h2>
            <p className="text-xs text-slate-500">
              Apply an authorized adjustment directly into the consumption ledger with full admin credentials and justification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Tool</label>
              <select
                value={overrideToolId}
                onChange={e => setOverrideToolId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold text-xs"
              >
                {activeTools.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id} ({t.itemName.slice(0, 25)}...) - {t.remainingLifespan.toLocaleString()} left
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Production Date</label>
              <input
                type="date"
                value={overrideDate}
                onChange={e => setOverrideDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift</label>
              <select
                value={overrideShiftId}
                onChange={e => setOverrideShiftId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Consumption (Strokes)</label>
              <input
                type="number"
                min="0"
                value={overrideQty}
                onChange={e => setOverrideQty(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Authorized Audit Reason <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Recalibration of batch 804 after mechanical counter audit."
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Apply Admin Override</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal: Tool Replacement Confirmation Dialog */}
      {replacingTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleReplacementSubmit}
            className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  Tool Replacement Authorization
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm physical tool swap and register new baseline counter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplacingTool(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Old vs New Comparison Box */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exhausted Tool (Old)</div>
                <div className="font-mono font-bold text-slate-800">{replacingTool.id}</div>
                <div className="text-slate-600 truncate">{replacingTool.itemName}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Total Consumed: {replacingTool.consumedLifespan.toLocaleString()} strokes
                </div>
                <div className="text-rose-600 font-mono text-[11px] font-bold">Status: Will change to REPLACED</div>
              </div>

              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-md space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">New Replacement Tool</div>
                <div className="font-mono font-bold text-blue-800">{replacementToolId || 'NEW-ID'}</div>
                <div className="text-slate-600 truncate">{replacingTool.itemName}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Initial Consumption: 0 strokes
                </div>
                <div className="text-emerald-700 font-mono text-[11px] font-bold">Status: ACTIVE · HEALTHY (100%)</div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Tool Identifier (Unique ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={replacementToolId}
                  onChange={e => setReplacementToolId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Tool Maximum Lifespan (Strokes) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={replacementMaxLifespan}
                  onChange={e => setReplacementMaxLifespan(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Replacement Reason & Quality Approval Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={replacementReason}
                  onChange={e => setReplacementReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReplacingTool(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReplacing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Execute Replacement</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Bulk Confirmation Dialog */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Bulk Operation</h3>
                <p className="text-xs text-slate-500">
                  TLMS Spec §2.6 Confirmation requirement before committing bulk updates.
                </p>
              </div>
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
              <div><strong>Production Date:</strong> <span className="font-mono font-semibold">{bulkDate}</span></div>
              <div><strong>Override Action:</strong> {bulkOverrideType === 'zero_consumption' ? 'Mark Zero Consumption (0 strokes)' : `Apply ${commonValue.toLocaleString()} strokes`}</div>
              <div><strong>Affected Tools Count:</strong> <span className="font-mono font-bold text-blue-700">{selectedBulkToolIds.length} tools</span></div>
              <div><strong>Justification:</strong> {bulkReason}</div>
            </div>

            <div className="text-xs text-slate-600 max-h-36 overflow-y-auto border border-slate-100 p-2 rounded bg-slate-50/50 space-y-1">
              <span className="font-semibold block text-slate-700 mb-1">Tools to be updated:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedBulkToolIds.map(id => (
                  <span key={id} className="font-mono text-[11px] bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {id}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulk}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Apply Bulk Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
