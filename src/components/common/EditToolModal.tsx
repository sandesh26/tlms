import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Tool, ToolStatus } from '../../types';
import { StatusBadge } from './StatusBadge';
import { 
  X, 
  Save, 
  Wrench, 
  Layers, 
  Cpu, 
  IndianRupee, 
  FileText, 
  AlertCircle, 
  Check, 
  Sliders,
  ShieldCheck
} from 'lucide-react';

interface EditToolModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditToolModal: React.FC<EditToolModalProps> = ({ tool, isOpen, onClose }) => {
  const { machines, updateTool, activeRole, currentUser } = useApp();

  const [itemName, setItemName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [recipeNumber, setRecipeNumber] = useState('');
  const [primaryMachineId, setPrimaryMachineId] = useState('');
  const [toolCost, setToolCost] = useState<number | ''>(0);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ToolStatus>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tool) {
      setItemName(tool.itemName || '');
      setProductCode(tool.productCode || '');
      setRecipeNumber(tool.recipeNumber || '');
      setPrimaryMachineId(tool.primaryMachineId || machines[0]?.id || '');
      setToolCost(tool.toolCost ?? 0);
      setDescription(tool.description || '');
      setNotes(tool.notes || '');
      setStatus(tool.status || 'active');
      setErrors({});
    }
  }, [tool, machines]);

  if (!isOpen || !tool) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!itemName.trim()) errs.itemName = 'Item / Tool Name is required';
    if (!productCode.trim()) errs.productCode = 'Product code is required';
    if (!recipeNumber.trim()) errs.recipeNumber = 'Recipe number is required';
    if (!primaryMachineId) errs.primaryMachineId = 'Please assign a primary machine';
    if (toolCost === '' || Number(toolCost) < 0) errs.toolCost = 'Enter a valid tool unit cost';
    return errs;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);

    const updated: Tool = {
      ...tool,
      itemName: itemName.trim(),
      productCode: productCode.trim().toUpperCase(),
      recipeNumber: recipeNumber.trim().toUpperCase(),
      primaryMachineId,
      machineIds: tool.machineIds.includes(primaryMachineId) ? tool.machineIds : [primaryMachineId, ...tool.machineIds],
      toolCost: Number(toolCost) || 0,
      description: description.trim(),
      notes: notes.trim(),
      status
    };

    updateTool(updated);
    setIsSubmitting(false);
    onClose();
  };

  const selectedMachine = machines.find(m => m.id === primaryMachineId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Edit Tool Configuration</h3>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {tool.id}
                </span>
                <StatusBadge condition={tool.lifespanCondition} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeRole === 'setter' ? (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 inline" />
                    Setter Authorized: Calibrate parameters, recipes, and machine allocations.
                  </span>
                ) : (
                  'Update tool master specifications, process references, and machine allocation.'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Read-only Life stats banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Max Lifespan</div>
              <div className="font-mono font-bold text-slate-800 tabular-nums">
                {tool.maxLifespan.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Consumed</div>
              <div className="font-mono font-bold text-slate-600 tabular-nums">
                {tool.consumedLifespan.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</div>
              <div className={`font-mono font-bold tabular-nums ${
                tool.lifespanCondition === 'critical' ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {tool.remainingLifespan.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Onboarded</div>
              <div className="font-mono text-slate-600">{tool.onboardingDate}</div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item / Tool Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="e.g. 50-Ohm FAKRA Crimping Punch Tool"
                className={`w-full px-3 py-2 bg-white border ${
                  errors.itemName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                } rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1`}
              />
              {errors.itemName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.itemName}</p>}
            </div>

            {/* Product Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={productCode}
                  onChange={e => setProductCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ROS-FK-9920"
                  className={`w-full px-3 py-2 bg-white border ${
                    errors.productCode ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  } rounded-md font-mono text-xs text-slate-900 uppercase focus:outline-none focus:ring-1`}
                />
              </div>
              {errors.productCode && <p className="text-[11px] text-rose-500 mt-0.5">{errors.productCode}</p>}
            </div>

            {/* Recipe Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipe Number / Setup Program <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipeNumber}
                  onChange={e => setRecipeNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. RCP-FK-088"
                  className={`w-full px-3 py-2 bg-white border ${
                    errors.recipeNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  } rounded-md font-mono text-xs text-slate-900 uppercase focus:outline-none focus:ring-1`}
                />
              </div>
              {errors.recipeNumber && <p className="text-[11px] text-rose-500 mt-0.5">{errors.recipeNumber}</p>}
            </div>

            {/* Primary Machine Assignment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Machine Assignment <span className="text-rose-500">*</span>
              </label>
              <select
                value={primaryMachineId}
                onChange={e => setPrimaryMachineId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name} ({m.location})
                  </option>
                ))}
              </select>
              {selectedMachine && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Location: <span className="font-medium text-slate-700">{selectedMachine.location}</span> ({selectedMachine.bay})
                </p>
              )}
            </div>

            {/* Tool Unit Cost */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tool Unit Cost (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={toolCost}
                  onChange={e => setToolCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              {errors.toolCost && <p className="text-[11px] text-rose-500 mt-0.5">{errors.toolCost}</p>}
            </div>

            {/* Status (Only Admin or Setter can toggle) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operational Status
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['active', 'maintenance', 'replaced', 'inactive'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border transition-colors capitalize cursor-pointer text-center ${
                      status === st
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Process Description & Application
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description of the tooling application, wire gauge, or connector family..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Operational Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Setter Notes & Calibration Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Calibrated stroke depth to 4.2mm, test run verified OK."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Editor: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({activeRole})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
