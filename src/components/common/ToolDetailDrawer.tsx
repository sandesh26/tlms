import React, { useState } from 'react';
import { useApp, isViewAllowed } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { EditToolModal } from './EditToolModal';
import { X, Wrench, Clock, AlertTriangle, ArrowRight, Activity, Calendar, Hash, IndianRupee, Layers, Edit3 } from 'lucide-react';

export const ToolDetailDrawer: React.FC = () => {
  const { 
    selectedToolForDrawer, 
    setSelectedToolForDrawer, 
    consumptions, 
    setCurrentView,
    machines,
    activeRole
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);

  if (!selectedToolForDrawer) return null;

  const tool = selectedToolForDrawer;
  const toolConsumptions = consumptions.filter(c => c.toolId === tool.id).slice(0, 10);
  const primaryMachine = machines.find(m => m.id === tool.primaryMachineId);

  const percentUsed = tool.maxLifespan > 0 
    ? Math.min(100, Math.round((tool.consumedLifespan / tool.maxLifespan) * 100))
    : 0;
  const percentRemaining = 100 - percentUsed;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-200 ease-out"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {tool.id}
              </span>
              <StatusBadge condition={tool.lifespanCondition} />
              <StatusBadge status={tool.status} />
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{tool.itemName}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Product Code: {tool.productCode} · Recipe: {tool.recipeNumber}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(activeRole === 'setter' || activeRole === 'admin') && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Edit Tool Parameters & Recipe"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Edit Tool</span>
              </button>
            )}
            <button
              onClick={() => setSelectedToolForDrawer(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Lifespan Gauge Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lifespan Status</span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {percentRemaining}% Remaining
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex relative">
              <div 
                className={`h-full transition-all duration-300 ${
                  tool.lifespanCondition === 'healthy' 
                    ? 'bg-emerald-500' 
                    : tool.lifespanCondition === 'moderate' 
                    ? 'bg-amber-500' 
                    : 'bg-rose-500'
                }`}
                style={{ width: `${percentRemaining}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/70 text-center font-mono">
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Max Lifespan</div>
                <div className="text-sm font-bold text-slate-800 tabular-nums">
                  {tool.maxLifespan.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Consumed</div>
                <div className="text-sm font-bold text-slate-600 tabular-nums">
                  {tool.consumedLifespan.toLocaleString()}
                </div>
              </div>
              <div className={`p-2 rounded border ${
                tool.lifespanCondition === 'critical' ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 uppercase font-sans">Remaining</div>
                <div className={`text-sm font-bold tabular-nums ${
                  tool.lifespanCondition === 'critical' ? 'text-rose-700' : 'text-slate-900'
                }`}>
                  {tool.remainingLifespan.toLocaleString()}
                </div>
              </div>
            </div>

            {tool.lifespanCondition === 'critical' && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded flex items-center gap-2 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Critical wear threshold reached (&le;10%). Immediate tool replacement or administrative swap required.</span>
              </div>
            )}
          </div>

          {/* Technical Specifications */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Tool Specifications</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <div className="text-slate-400 text-[11px] mb-0.5">Primary Machine</div>
                <div className="font-semibold text-slate-800">{primaryMachine ? primaryMachine.code : tool.primaryMachineId}</div>
                <div className="text-[11px] text-slate-500 truncate">{primaryMachine?.name}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <div className="text-slate-400 text-[11px] mb-0.5">Machine Location</div>
                <div className="font-semibold text-slate-800">{primaryMachine?.location || 'Plant Floor'}</div>
                <div className="text-[11px] text-slate-500">{primaryMachine?.bay || 'Bay 1'}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <div className="text-slate-400 text-[11px] mb-0.5">Recipe Reference</div>
                <div className="font-mono font-semibold text-slate-800">{tool.recipeNumber}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <div className="text-slate-400 text-[11px] mb-0.5">Unit Tool Cost</div>
                <div className="font-mono font-semibold text-slate-800">₹{tool.toolCost.toLocaleString()}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <div className="text-slate-400 text-[11px] mb-0.5">Onboarded Date</div>
                <div className="font-mono text-slate-700">{tool.onboardingDate}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <div className="text-slate-400 text-[11px] mb-0.5">Last Consumption Logged</div>
                <div className="font-mono text-slate-700">{tool.lastConsumptionDate || 'No records yet'}</div>
              </div>
            </div>

            {tool.description && (
              <div className="mt-3 p-3 bg-white border border-slate-200 rounded-md text-xs">
                <div className="text-slate-400 text-[11px] mb-1">Process Description</div>
                <p className="text-slate-700 leading-relaxed">{tool.description}</p>
              </div>
            )}

            {tool.notes && (
              <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-md text-xs text-amber-900">
                <strong>Operational Notes:</strong> {tool.notes}
              </div>
            )}

            {tool.replacedFromToolId && (
              <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900">
                <strong>Replacement Lineage:</strong> Replaced predecessor tool <span className="font-mono font-bold">{tool.replacedFromToolId}</span>.
              </div>
            )}

            {tool.replacedByToolId && (
              <div className="mt-2 p-2.5 bg-slate-100 border border-slate-300 rounded-md text-xs text-slate-800">
                <strong>Superseded:</strong> This tool was decommissioned and superseded by <span className="font-mono font-bold">{tool.replacedByToolId}</span> on {tool.replacementDate}.
              </div>
            )}
          </div>

          {/* Recent Shift Consumption History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Consumption Entries</h3>
              <span className="text-[11px] font-mono text-slate-400">{toolConsumptions.length} entries shown</span>
            </div>

            {toolConsumptions.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
                No consumption records captured yet for this tool.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Date / Shift</th>
                      <th className="px-3 py-2 text-right">Qty (Strokes)</th>
                      <th className="px-3 py-2 text-right">Remaining</th>
                      <th className="px-3 py-2">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {toolConsumptions.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <div className="text-slate-800 font-medium">{entry.productionDate}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{entry.shiftName}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                          {entry.quantity.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600 tabular-nums">
                          {entry.newRemaining.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-sans">
                          <div className="text-slate-800 truncate max-w-[100px]">{entry.userName}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{entry.entryType.replace('_', ' ')}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            {(activeRole === 'setter' || activeRole === 'admin') && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Edit Tool</span>
              </button>
            )}

            {isViewAllowed(activeRole, 'shift-consumption') && (
              <button
                onClick={() => {
                  setSelectedToolForDrawer(null);
                  setCurrentView('shift-consumption');
                }}
                className="px-3.5 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Record Consumption</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isViewAllowed(activeRole, 'admin-tool-management') && (
              <button
                onClick={() => {
                  setSelectedToolForDrawer(null);
                  setCurrentView('admin-tool-management');
                }}
                className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Tool Swap</span>
              </button>
            )}

            <button
              onClick={() => setSelectedToolForDrawer(null)}
              className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>

      {/* Edit Tool Modal */}
      <EditToolModal
        tool={tool}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </div>
  );
};
