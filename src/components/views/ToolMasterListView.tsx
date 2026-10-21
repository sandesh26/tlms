import React, { useState, useMemo } from 'react';
import { useApp, isViewAllowed } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { Tool, LifespanStatus, ToolStatus } from '../../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Clock, 
  RotateCw, 
  SlidersHorizontal,
  ChevronDown,
  CheckSquare,
  Square,
  RefreshCw,
  X,
  Check,
  ShieldAlert,
  Edit3,
  Wrench
} from 'lucide-react';
import { EditToolModal } from '../common/EditToolModal';

export const ToolMasterListView: React.FC = () => {
  const { 
    tools, 
    machines, 
    setCurrentView, 
    setSelectedToolForDrawer,
    showToast,
    activeRole,
    replaceTool,
    setActiveRole
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  // Bulk selection state
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [showBatchReplaceModal, setShowBatchReplaceModal] = useState(false);
  const [batchReplaceReason, setBatchReplaceReason] = useState('Scheduled preventative tool replacement for worn tooling');
  const [isBatchReplacing, setIsBatchReplacing] = useState(false);

  // Tool Editing modal state (available for Setter and Admin roles)
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        tool.id.toLowerCase().includes(q) ||
        tool.productCode.toLowerCase().includes(q) ||
        tool.itemName.toLowerCase().includes(q) ||
        tool.recipeNumber.toLowerCase().includes(q)
      );

      // Machine
      const matchesMachine = selectedMachine === 'all' || tool.primaryMachineId === selectedMachine;

      // Condition
      const matchesCondition = selectedCondition === 'all' || tool.lifespanCondition === selectedCondition;

      // Status
      const matchesStatus = selectedStatus === 'all' || tool.status === selectedStatus;

      return matchesSearch && matchesMachine && matchesCondition && matchesStatus;
    });
  }, [tools, searchQuery, selectedMachine, selectedCondition, selectedStatus]);

  // Bulk selection helpers
  const isAllFilteredSelected = filteredTools.length > 0 && filteredTools.every(t => selectedToolIds.includes(t.id));
  const isPartiallySelected = selectedToolIds.length > 0 && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered tools
      const filteredIdSet = new Set(filteredTools.map(t => t.id));
      setSelectedToolIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      // Select all filtered tools
      const combined = new Set([...selectedToolIds, ...filteredTools.map(t => t.id)]);
      setSelectedToolIds(Array.from(combined));
    }
  };

  const handleToggleToolSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedToolIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedToolIds([]);
  };

  // Export full filtered list
  const handleExportCSV = () => {
    const headers = ['Tool ID', 'Product Code', 'Item Name', 'Machine', 'Recipe', 'Cost (INR)', 'Max Lifespan', 'Consumed', 'Remaining', 'Condition', 'Status'];
    const rows = filteredTools.map(t => [
      t.id,
      t.productCode,
      `"${t.itemName.replace(/"/g, '""')}"`,
      t.primaryMachineId,
      t.recipeNumber,
      t.toolCost,
      t.maxLifespan,
      t.consumedLifespan,
      t.remainingLifespan,
      t.lifespanCondition,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rosenberger_Tool_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported filtered Tool Master records to CSV', 'success');
  };

  // Export ONLY selected tools
  const handleExportSelectedCSV = () => {
    const selectedToolsList = tools.filter(t => selectedToolIds.includes(t.id));
    if (selectedToolsList.length === 0) {
      showToast('No tools selected for export', 'warning');
      return;
    }

    const headers = ['Tool ID', 'Product Code', 'Item Name', 'Machine', 'Recipe', 'Cost (INR)', 'Max Lifespan', 'Consumed', 'Remaining', 'Condition', 'Status'];
    const rows = selectedToolsList.map(t => [
      t.id,
      t.productCode,
      `"${t.itemName.replace(/"/g, '""')}"`,
      t.primaryMachineId,
      t.recipeNumber,
      t.toolCost,
      t.maxLifespan,
      t.consumedLifespan,
      t.remainingLifespan,
      t.lifespanCondition,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rosenberger_Selected_${selectedToolsList.length}_Tools_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selectedToolsList.length} selected tools to CSV`, 'success');
  };

  // Execute batch replacement
  const handleExecuteBatchReplace = () => {
    const selectedToolsList = tools.filter(t => selectedToolIds.includes(t.id));
    if (selectedToolsList.length === 0) return;

    setIsBatchReplacing(true);
    let successCount = 0;

    selectedToolsList.forEach((oldTool, idx) => {
      // Generate successor ID (e.g. TL-CR-4029 -> TL-CR-4030 or suffix)
      const parts = oldTool.id.split('-');
      let newId = `${oldTool.id}-R${Date.now().toString().slice(-3)}${idx}`;
      if (parts.length >= 3 && !isNaN(parseInt(parts[2], 10))) {
        const prefix = parts.slice(0, 2).join('-');
        const nextNum = parseInt(parts[2], 10) + 1;
        const candidate = `${prefix}-${nextNum}`;
        if (!tools.some(t => t.id === candidate)) {
          newId = candidate;
        }
      }

      const res = replaceTool({
        oldToolId: oldTool.id,
        newToolId: newId,
        productCode: oldTool.productCode,
        itemName: oldTool.itemName,
        description: `Batch replacement for ${oldTool.id}. ${oldTool.description}`,
        recipeNumber: oldTool.recipeNumber,
        toolCost: oldTool.toolCost,
        machineId: oldTool.primaryMachineId,
        maxLifespan: oldTool.maxLifespan,
        reason: batchReplaceReason.trim()
      });

      if (res) successCount++;
    });

    setIsBatchReplacing(false);
    setShowBatchReplaceModal(false);
    setSelectedToolIds([]);

    showToast(
      `Batch replacement completed: ${successCount} tools retired and replaced with 0-stroke baselines.`,
      'success',
      'Batch Replacement Finished'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Master Data & Lifecycle Register
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tool Master List</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete inventory of production tools, stroke counter balances, machine associations, and replacement health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {isViewAllowed(activeRole, 'tool-registration') && (
            <button
              onClick={() => setCurrentView('tool-registration')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Tool</span>
            </button>
          )}
        </div>
      </div>

      {/* Setter Mode Informational Banner */}
      {activeRole === 'setter' && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-900">Tool Setter Workspace: </span>
              <span className="text-amber-800">
                You have permission to edit and calibrate recipes, machine mounting, and tool specifications. Click the <strong>Edit</strong> button on any tool below to adjust parameters. <em>(Tool creation is restricted to Administrators).</em>
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/50 px-2.5 py-1 rounded border border-amber-300/60 shrink-0 self-start sm:self-auto">
            Edit-Only Authorized
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Tool ID, Product, Recipe..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Machine Filter */}
          <div>
            <select
              value={selectedMachine}
              onChange={e => setSelectedMachine(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Machines (Fleet-wide)</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <select
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Lifespan Conditions</option>
              <option value="healthy">Healthy (&gt;30% remaining)</option>
              <option value="moderate">Near End of Life (10% - 30%)</option>
              <option value="critical">Critical / Expired (&le;10%)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active In Production</option>
              <option value="replaced">Replaced / Archived</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800 font-mono">{filteredTools.length}</strong> of{' '}
            <span className="font-mono">{tools.length}</span> tools
          </div>
          {(searchQuery || selectedMachine !== 'all' || selectedCondition !== 'all' || selectedStatus !== 'active') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMachine('all');
                setSelectedCondition('all');
                setSelectedStatus('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Floating Batch Action Toolbar (When 1+ tools selected) */}
      {selectedToolIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-lg p-3 px-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-blue-600 px-2.5 py-1 rounded text-white font-mono font-bold">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedToolIds.length} Selected</span>
            </div>
            <span className="text-slate-300 text-xs">
              Batch actions available for selected tools:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Batch Export */}
            <button
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Selected ({selectedToolIds.length})</span>
            </button>

            {/* Batch Replace */}
            <button
              onClick={() => setShowBatchReplaceModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Batch Replace ({selectedToolIds.length})</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={handleClearSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear tool selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* High-Density Data Table with Selection Checkbox Column */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider select-none">
              <tr>
                {/* Bulk Select All Checkbox Header */}
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={input => {
                      if (input) {
                        input.indeterminate = isPartiallySelected;
                      }
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    title="Select all filtered tools"
                  />
                </th>
                <th className="px-4 py-3">Tool Identifier</th>
                <th className="px-3 py-3">Product / Recipe</th>
                <th className="px-3 py-3">Machine & Location</th>
                <th className="px-3 py-3 text-right">Max Lifespan</th>
                <th className="px-3 py-3 text-right">Consumed</th>
                <th className="px-4 py-3 text-right">Remaining Lifespan</th>
                <th className="px-3 py-3 text-center">Health Condition</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No tools match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTools.map(tool => {
                  const targetMachine = machines.find(m => m.id === tool.primaryMachineId);
                  const isSelected = selectedToolIds.includes(tool.id);
                  const percentRemaining = tool.maxLifespan > 0
                    ? Math.max(0, Math.round((tool.remainingLifespan / tool.maxLifespan) * 100))
                    : 0;

                  return (
                    <tr
                      key={tool.id}
                      className={`transition-colors group cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50/70 border-l-2 border-l-blue-600' 
                          : 'hover:bg-slate-50/80'
                      }`}
                      onClick={() => setSelectedToolForDrawer(tool)}
                    >
                      {/* Checkbox Cell */}
                      <td 
                        className="px-3 py-3 text-center" 
                        onClick={e => handleToggleToolSelection(tool.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by cell click
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Tool ID & Item Name */}
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-blue-700 text-xs flex items-center gap-1.5">
                          {tool.id}
                        </div>
                        <div className="font-medium text-slate-900 text-xs truncate max-w-[220px]" title={tool.itemName}>
                          {tool.itemName}
                        </div>
                      </td>

                      {/* Product Code & Recipe */}
                      <td className="px-3 py-3">
                        <div className="font-mono font-medium text-slate-800">{tool.productCode}</div>
                        <div className="text-[11px] font-mono text-slate-500">{tool.recipeNumber}</div>
                      </td>

                      {/* Machine Association */}
                      <td className="px-3 py-3">
                        <div className="font-mono font-semibold text-slate-800">
                          {targetMachine ? targetMachine.code : tool.primaryMachineId}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {targetMachine ? targetMachine.location : 'Bay 1'}
                        </div>
                      </td>

                      {/* Max Lifespan */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-600">
                        {tool.maxLifespan.toLocaleString()}
                      </td>

                      {/* Consumed */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700 font-medium">
                        {tool.consumedLifespan.toLocaleString()}
                      </td>

                      {/* Remaining Lifespan & Progress */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 font-mono tabular-nums font-bold text-slate-900">
                          <span>{tool.remainingLifespan.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({percentRemaining}%)</span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              tool.lifespanCondition === 'healthy'
                                ? 'bg-emerald-500'
                                : tool.lifespanCondition === 'moderate'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${percentRemaining}%` }}
                          />
                        </div>
                      </td>

                      {/* Condition Badge */}
                      <td className="px-3 py-3 text-center">
                        <StatusBadge condition={tool.lifespanCondition} />
                      </td>

                      {/* Tool Status */}
                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={tool.status} />
                      </td>

                      {/* Quick Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {(activeRole === 'setter' || activeRole === 'admin') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTool(tool);
                              }}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                activeRole === 'setter'
                                  ? 'text-amber-800 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300 font-semibold'
                                  : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title={activeRole === 'setter' ? "Edit Tool Specifications & Recipe (Setter Authorized)" : "Edit Tool"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedToolForDrawer(tool)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Inspect tool details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setCurrentView('shift-consumption');
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Log Shift Consumption"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Tool Replacement Modal */}
      {showBatchReplaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  Batch Tool Replacement ({selectedToolIds.length} Tools)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Retire selected exhausted tooling and initialize new replacement units with 0-consumption baselines.
                </p>
              </div>
              <button
                onClick={() => setShowBatchReplaceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role Check Warning */}
            {activeRole !== 'admin' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Administrator Authorization Required</span>
                </div>
                <p>
                  Executing physical tool replacements and initializing new lifetime baselines requires Administrator authorization. Your current role is <strong>{activeRole.toUpperCase()}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveRole('admin');
                      showToast('Switched to Administrator role. You may now execute the batch replacement.', 'info');
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                  >
                    Switch to Administrator Role
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* List of tools to be replaced */}
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50 max-h-48 overflow-y-auto space-y-2 text-xs">
                  <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                    Selected Tools for Succession:
                  </div>
                  {tools
                    .filter(t => selectedToolIds.includes(t.id))
                    .map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                        <div>
                          <div className="font-mono font-bold text-slate-800">{t.id}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.itemName}</div>
                        </div>
                        <div className="text-right">
                          <StatusBadge condition={t.lifespanCondition} />
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {t.remainingLifespan.toLocaleString()} remaining
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Justification input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Replacement Reason & Audit Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={batchReplaceReason}
                    onChange={e => setBatchReplaceReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Successor tools will inherit machine associations and recipe codes with fresh stroke counters.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowBatchReplaceModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteBatchReplace}
                    disabled={isBatchReplacing}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Batch Replacement ({selectedToolIds.length})</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Tool Modal */}
      <EditToolModal
        tool={editingTool}
        isOpen={Boolean(editingTool)}
        onClose={() => setEditingTool(null)}
      />
    </div>
  );
};
