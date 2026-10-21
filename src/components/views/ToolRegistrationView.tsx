import React, { useState } from 'react';
import { useApp, calculateLifespanCondition } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Plus, 
  Check, 
  AlertCircle, 
  Wrench, 
  Cpu, 
  IndianRupee, 
  FileText, 
  Layers, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export const ToolRegistrationView: React.FC = () => {
  const { machines, registerTool, setCurrentView, tools, activeRole } = useApp();

  const [toolId, setToolId] = useState('');
  const [productCode, setProductCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [recipeNumber, setRecipeNumber] = useState('');
  const [toolCost, setToolCost] = useState<number | ''>(45000);
  const [primaryMachineId, setPrimaryMachineId] = useState<string>(machines[0]?.id || '');
  const [maxLifespan, setMaxLifespan] = useState<number | ''>(100000);
  const [isPreUsed, setIsPreUsed] = useState(false);
  const [initialUsedLifespan, setInitialUsedLifespan] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live preview numbers
  const maxL = typeof maxLifespan === 'number' ? maxLifespan : 0;
  const usedL = isPreUsed && typeof initialUsedLifespan === 'number' ? initialUsedLifespan : 0;
  const remainingL = Math.max(0, maxL - usedL);
  const conditionPreview = calculateLifespanCondition(maxL, remainingL);

  const selectedMachine = machines.find(m => m.id === primaryMachineId);

  // Duplicate ID warning
  const isDuplicateId = Boolean(toolId.trim() && tools.some(t => t.id.toLowerCase() === toolId.trim().toLowerCase()));

  // Role Guard: Setters can only edit tools, not register new ones
  if (activeRole === 'setter') {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-lg p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <Wrench className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Tool Registration Restricted to Administrators</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            As a <strong>Tool Setter</strong>, your role permissions allow editing existing tool configurations, recipes, and machine allocations. Registering brand-new master tooling requires Administrator privileges.
          </p>
        </div>
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-md text-xs text-amber-900 text-left max-w-md mx-auto">
          <div className="font-semibold text-amber-900 mb-1">Permitted Setter Duties:</div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
            <li>Edit tool recipes, parameters, and machine mounting in Tool Master</li>
            <li>Inspect wear conditions and conduct trial runs</li>
            <li>Record shift-end tool stroke consumption</li>
          </ul>
        </div>
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setCurrentView('tool-master')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open Tool Master to Edit Existing Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const handleValidate = () => {
    const errors: Record<string, string> = {};
    if (!toolId.trim()) errors.toolId = 'Tool Identifier is required (e.g. TL-ST-8821)';
    if (isDuplicateId) errors.toolId = 'A tool with this ID already exists';
    if (!productCode.trim()) errors.productCode = 'Product code is required';
    if (!itemName.trim()) errors.itemName = 'Item name is required';
    if (!recipeNumber.trim()) errors.recipeNumber = 'Recipe number is required';
    if (!primaryMachineId) errors.primaryMachineId = 'Please associate a machine';
    if (!maxLifespan || maxLifespan <= 0) errors.maxLifespan = 'Enter a valid maximum lifespan';
    if (isPreUsed && (initialUsedLifespan === '' || Number(initialUsedLifespan) < 0)) {
      errors.initialUsedLifespan = 'Enter valid initial consumed strokes';
    }
    if (isPreUsed && Number(initialUsedLifespan) > Number(maxLifespan)) {
      errors.initialUsedLifespan = 'Consumed strokes cannot exceed maximum lifespan';
    }
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = handleValidate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    const result = registerTool({
      id: toolId.trim().toUpperCase(),
      productCode: productCode.trim().toUpperCase(),
      itemName: itemName.trim(),
      description: description.trim(),
      recipeNumber: recipeNumber.trim().toUpperCase(),
      toolCost: Number(toolCost) || 0,
      machineIds: [primaryMachineId],
      primaryMachineId,
      maxLifespan: Number(maxLifespan),
      initialUsedLifespan: isPreUsed ? Number(initialUsedLifespan) : 0,
      notes: notes.trim()
    });

    setIsSubmitting(false);

    if (result.success) {
      // Clear or navigate
      setCurrentView('tool-master');
    } else if (result.error) {
      setFormErrors({ toolId: result.error });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Tool Onboarding & Commissioning
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Register New Production Tool</h1>
        <p className="text-xs text-slate-500 mt-1">
          Onboard stamping punches, crimping dies, wire strippers, and micro-tools into the Rosenberger TLMS database.
          Configure recipe parameters, machine association, and baseline lifespan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form (2 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {/* Section 1: Identification */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-xs flex items-center justify-center font-bold">1</span>
              Tool Identification & Product Reference
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tool Identifier (Tool ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TL-CR-4030"
                  value={toolId}
                  onChange={e => {
                    setToolId(e.target.value);
                    if (formErrors.toolId) setFormErrors({ ...formErrors, toolId: '' });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white ${
                    formErrors.toolId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {formErrors.toolId && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.toolId}
                  </p>
                )}
                {isDuplicateId && (
                  <p className="text-[11px] text-rose-600 mt-1">Warning: This Tool ID is already in use.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Code / Part Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. FAKRA-SMB-RT"
                  value={productCode}
                  onChange={e => {
                    setProductCode(e.target.value);
                    if (formErrors.productCode) setFormErrors({ ...formErrors, productCode: '' });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white ${
                    formErrors.productCode ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.productCode && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.productCode}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name / Specification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Precision Wire Crimp Die Set 0.50mm² (Carbide Core)"
                  value={itemName}
                  onChange={e => {
                    setItemName(e.target.value);
                    if (formErrors.itemName) setFormErrors({ ...formErrors, itemName: '' });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white ${
                    formErrors.itemName ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.itemName && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.itemName}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Process Description & Technical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed tooling application, tolerance notes, sharpening cycles..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Machine & Process Parameters */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-xs flex items-center justify-center font-bold">2</span>
              Machine Association & Recipe Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Machine Association <span className="text-rose-500">*</span>
                </label>
                <select
                  value={primaryMachineId}
                  onChange={e => setPrimaryMachineId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} ({m.location})
                    </option>
                  ))}
                </select>
                {selectedMachine && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Installed in: {selectedMachine.location} · {selectedMachine.bay}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipe / Program Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. RCP-2026-X1"
                  value={recipeNumber}
                  onChange={e => {
                    setRecipeNumber(e.target.value);
                    if (formErrors.recipeNumber) setFormErrors({ ...formErrors, recipeNumber: '' });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white ${
                    formErrors.recipeNumber ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.recipeNumber && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.recipeNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tool Cost (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="45000"
                    value={toolCost}
                    onChange={e => setToolCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Tool Status
                </label>
                <select
                  disabled
                  value="active"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-xs text-slate-700 cursor-not-allowed"
                >
                  <option value="active">Active In Production</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Default status on onboarding</span>
              </div>
            </div>
          </div>

          {/* Section 3: Lifespan Setup */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-xs flex items-center justify-center font-bold">3</span>
              Lifespan Baseline & Pre-Used Setting
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Rated Lifespan (Strokes / Cycles) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  placeholder="100000"
                  value={maxLifespan}
                  onChange={e => {
                    setMaxLifespan(e.target.value === '' ? '' : Number(e.target.value));
                    if (formErrors.maxLifespan) setFormErrors({ ...formErrors, maxLifespan: '' });
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white ${
                    formErrors.maxLifespan ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.maxLifespan && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.maxLifespan}</p>
                )}
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Tool lifetime guarantee from manufacturer drawing.
                </span>
              </div>

              <div>
                {/* Pre-used checkbox */}
                <div className="flex items-center gap-2 pt-1 mb-2">
                  <input
                    type="checkbox"
                    id="preused-toggle"
                    checked={isPreUsed}
                    onChange={e => setIsPreUsed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="preused-toggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Tool was already in use before onboarding
                  </label>
                </div>

                {isPreUsed ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Already Consumed Lifespan (Strokes) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxL}
                      value={initialUsedLifespan}
                      onChange={e => {
                        setInitialUsedLifespan(e.target.value === '' ? '' : Number(e.target.value));
                        if (formErrors.initialUsedLifespan) setFormErrors({ ...formErrors, initialUsedLifespan: '' });
                      }}
                      className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    {formErrors.initialUsedLifespan && (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.initialUsedLifespan}</p>
                    )}
                    <span className="text-[11px] text-amber-700 mt-0.5 block">
                      Initial remaining will be calculated as {maxL.toLocaleString()} − {usedL.toLocaleString()} = {remainingL.toLocaleString()} strokes.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-500">
                    Fresh tool: Starts with 0 strokes consumed and 100% remaining lifespan.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentView('tool-master')}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Complete Tool Registration</span>
            </button>
          </div>
        </form>

        {/* Live Preview Card (1 col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 sticky top-20 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Registration Master Preview
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {toolId || 'TL-XXXX-0000'}
                </span>
                <StatusBadge condition={conditionPreview} />
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {itemName || 'Tool Specification Name'}
                </div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  Product: {productCode || '---'} · Recipe: {recipeNumber || '---'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Machine:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {selectedMachine ? selectedMachine.code : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plant Location:</span>
                  <span className="text-slate-700 truncate max-w-[150px]">
                    {selectedMachine ? selectedMachine.location : 'Bay 1'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Cost:</span>
                  <span className="font-mono text-slate-800 font-semibold">₹{Number(toolCost || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Lifespan Gauge Preview */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-500 font-sans">Initial Remaining:</span>
                  <span className="font-bold text-slate-900">{remainingL.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      conditionPreview === 'healthy'
                        ? 'bg-emerald-500'
                        : conditionPreview === 'moderate'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${maxL > 0 ? (remainingL / maxL) * 100 : 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Used: {usedL.toLocaleString()}</span>
                  <span>Max: {maxL.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50/60 border border-blue-200/70 rounded-md text-xs text-blue-900 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-blue-600" /> Validation Invariants
              </div>
              <p className="text-[11px] text-blue-800 leading-normal">
                Once saved, tool will be mounted on the selected machine and immediately available for Shift Consumption recording.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
