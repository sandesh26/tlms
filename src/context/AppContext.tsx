import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Tool, 
  Machine, 
  User, 
  Shift, 
  ConsumptionEntry, 
  CorrectionRecord, 
  MissedEntryAlert, 
  UserRole,
  LifespanStatus,
  BulkZeroConsumptionPayload,
  ToolReplacementPayload,
  ActivityLog
} from '../types';
import { 
  INITIAL_MACHINES, 
  INITIAL_SHIFTS, 
  INITIAL_USERS, 
  INITIAL_TOOLS, 
  INITIAL_CONSUMPTIONS, 
  INITIAL_MISSED_ALERTS, 
  INITIAL_CORRECTIONS,
  INITIAL_ACTIVITY_LOGS
} from '../data/initialData';

export type ViewType = 
  | 'dashboard'
  | 'tool-master'
  | 'tool-registration'
  | 'shift-consumption'
  | 'missed-consumption'
  | 'admin-tool-management'
  | 'master-data'
  | 'reports-export'
  | 'activity-logs';

export interface RoleConfig {
  label: string;
  badge: string;
  allowedViews: ViewType[];
  defaultView: ViewType;
  duties: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RoleConfig> = {
  admin: {
    label: 'Administrator',
    badge: 'Full Plant Access (9 Modules)',
    allowedViews: [
      'dashboard',
      'tool-master',
      'tool-registration',
      'shift-consumption',
      'missed-consumption',
      'admin-tool-management',
      'master-data',
      'reports-export',
      'activity-logs'
    ],
    defaultView: 'dashboard',
    duties: 'Full master data, tool replacements, bulk zero-consumption, system overrides, activity logs, and Excel upload.'
  },
  supervisor: {
    label: 'Shift Supervisor',
    badge: 'Shift Governance (6 Modules)',
    allowedViews: [
      'dashboard',
      'missed-consumption',
      'tool-master',
      'reports-export',
      'shift-consumption',
      'activity-logs'
    ],
    defaultView: 'missed-consumption',
    duties: 'Reconcile operator missed shift entries, audit consumption corrections, inspect activity logs, and monitor shift health.'
  },
  setter: {
    label: 'Tool Setter',
    badge: 'Tool Setup & Dashboard (3 Modules)',
    allowedViews: [
      'dashboard',
      'tool-master',
      'shift-consumption'
    ],
    defaultView: 'dashboard',
    duties: 'Monitor tooling fleet wear, inspect punch & die readiness, edit tool specs & machine mounting, and verify shift stroke consumption (tool onboarding restricted to Admin).'
  },
  operator: {
    label: 'Machine Operator',
    badge: 'Shift Entry Only (2 Modules)',
    allowedViews: [
      'shift-consumption',
      'tool-master'
    ],
    defaultView: 'shift-consumption',
    duties: 'Record shift-end tool stroke consumption and verify remaining tool lifespan.'
  }
};

export const VIEW_TITLES: Record<ViewType, string> = {
  'dashboard': 'Executive Plant Dashboard',
  'tool-master': 'Tool Master Ledger',
  'tool-registration': 'New Tool Registration',
  'shift-consumption': 'Shift Consumption Recording',
  'missed-consumption': 'Missed Entries & Corrections',
  'admin-tool-management': 'Admin Overrides & Tool Replacement',
  'master-data': 'Master Data Administration',
  'reports-export': 'Audit Reports & Data Export',
  'activity-logs': 'Activity Logs & Audit History'
};

export function isViewAllowed(role: UserRole, view: ViewType): boolean {
  return ROLE_PERMISSIONS[role]?.allowedViews.includes(view) ?? false;
}

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title?: string;
}

interface AppContextType {
  tools: Tool[];
  machines: Machine[];
  shifts: Shift[];
  users: User[];
  consumptions: ConsumptionEntry[];
  missedAlerts: MissedEntryAlert[];
  corrections: CorrectionRecord[];
  activityLogs: ActivityLog[];
  activeRole: UserRole;
  currentUser: User;
  currentView: ViewType;
  toasts: ToastState[];
  selectedToolForDrawer: Tool | null;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  // Navigation & role
  setActiveRole: (role: UserRole) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedToolForDrawer: (tool: Tool | null) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error', title?: string) => void;
  dismissToast: (id: string) => void;
  logActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearActivityLogs: () => void;
  // Business Actions
  recordConsumption: (data: {
    toolId: string;
    machineId: string;
    productionDate: string;
    shiftId: string;
    quantity: number;
    reason?: string;
  }) => boolean;
  resolveMissedEntry: (alertId: string, quantity: number, reason: string) => boolean;
  applyAdminOverride: (data: {
    toolId: string;
    machineId: string;
    productionDate: string;
    shiftId: string;
    quantity: number;
    reason: string;
  }) => boolean;
  applyBulkZeroConsumption: (payload: BulkZeroConsumptionPayload) => boolean;
  replaceTool: (payload: ToolReplacementPayload) => boolean;
  registerTool: (tool: {
    id: string;
    productCode: string;
    itemName: string;
    description: string;
    recipeNumber: string;
    toolCost: number;
    machineIds: string[];
    primaryMachineId: string;
    maxLifespan: number;
    initialUsedLifespan?: number;
    notes?: string;
  }) => { success: boolean; error?: string };
  updateTool: (tool: Tool) => void;
  correctConsumption: (data: {
    entryId: string;
    correctedQuantity: number;
    reason: string;
  }) => boolean;
  // Master data administration actions
  addMachine: (machine: Omit<Machine, 'activeToolIds'>) => boolean;
  updateMachine: (machine: Machine) => void;
  toggleMachineStatus: (machineId: string) => void;
  addUser: (user: Omit<User, 'id'>) => boolean;
  updateUser: (user: User) => void;
  toggleUserStatus: (userId: string) => void;
  updateShift: (shift: Shift) => void;
  importMasterData: (type: 'users' | 'machines' | 'tools', importedData: any[]) => { successCount: number; errorCount: number };
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function calculateLifespanCondition(maxLifespan: number, remainingLifespan: number): LifespanStatus {
  if (maxLifespan <= 0) return 'critical';
  const ratio = remainingLifespan / maxLifespan;
  if (remainingLifespan <= 0 || ratio <= 0.10) {
    return 'critical';
  }
  if (ratio <= 0.30) {
    return 'moderate';
  }
  return 'healthy';
}

const STORAGE_KEY_PREFIX = 'rosenberger_tlms_v1_';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}tools`);
    return saved ? JSON.parse(saved) : INITIAL_TOOLS;
  });

  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}machines`);
    return saved ? JSON.parse(saved) : INITIAL_MACHINES;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}shifts`);
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [consumptions, setConsumptions] = useState<ConsumptionEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}consumptions`);
    return saved ? JSON.parse(saved) : INITIAL_CONSUMPTIONS;
  });

  const [missedAlerts, setMissedAlerts] = useState<MissedEntryAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}missedAlerts`);
    return saved ? JSON.parse(saved) : INITIAL_MISSED_ALERTS;
  });

  const [corrections, setCorrections] = useState<CorrectionRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}corrections`);
    return saved ? JSON.parse(saved) : INITIAL_CORRECTIONS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}activityLogs`);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [activeRole, setActiveRoleState] = useState<UserRole>('admin');
  const [currentView, setCurrentViewState] = useState<ViewType>('dashboard');
  const [selectedToolForDrawer, setSelectedToolForDrawer] = useState<Tool | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tools`, JSON.stringify(tools));
  }, [tools]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}machines`, JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}shifts`, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}consumptions`, JSON.stringify(consumptions));
  }, [consumptions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}missedAlerts`, JSON.stringify(missedAlerts));
  }, [missedAlerts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}corrections`, JSON.stringify(corrections));
  }, [corrections]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}activityLogs`, JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Derive current user representation based on role
  const currentUser: User = users.find(u => u.role === activeRole && u.status === 'active') || {
    id: `USR-${activeRole.toUpperCase()}-TEMP`,
    employeeId: `EMP-${activeRole.toUpperCase()}`,
    name: activeRole === 'admin' ? 'Anil Vernekar (Admin)' :
          activeRole === 'supervisor' ? 'Dilip Shenvi (Supervisor)' :
          activeRole === 'setter' ? 'Amit Borkar (Setter)' : 'Sandesh Gaonkar (Operator)',
    role: activeRole,
    status: 'active'
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const logActivity = (logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLog = {
      id: `ACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      ...logData
    };
    setActivityLogs(prev => [newEntry, ...prev]);
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    showToast('Activity logs cleared', 'info');
  };

  const setCurrentView = (view: ViewType) => {
    if (!isViewAllowed(activeRole, view)) {
      showToast(
        `Access Restricted: "${VIEW_TITLES[view] || view}" is not permitted for ${ROLE_PERMISSIONS[activeRole].label}.`,
        'warning',
        'Unauthorized View'
      );
      return;
    }
    setCurrentViewState(view);
  };

  const setActiveRole = (newRole: UserRole) => {
    setActiveRoleState(newRole);
    const roleConfig = ROLE_PERMISSIONS[newRole];

    // Determine target view based on role duties:
    let nextView: ViewType = currentView;
    if (!roleConfig.allowedViews.includes(currentView)) {
      nextView = roleConfig.defaultView;
    } else if (newRole === 'operator') {
      // Operators are dedicated to shift consumption
      nextView = 'shift-consumption';
    }

    setCurrentViewState(nextView);

    showToast(
      `Switched to ${roleConfig.label}. Screen set to "${VIEW_TITLES[nextView]}". ${roleConfig.badge}.`,
      'info',
      'Role Switched'
    );
  };

  // 1. Record Shift Consumption (Operators / Setters)
  const recordConsumption = (data: {
    toolId: string;
    machineId: string;
    productionDate: string;
    shiftId: string;
    quantity: number;
    reason?: string;
  }): boolean => {
    const targetTool = tools.find(t => t.id === data.toolId);
    const targetMachine = machines.find(m => m.id === data.machineId);
    const targetShift = shifts.find(s => s.id === data.shiftId);

    if (!targetTool) {
      showToast('Selected tool not found in tool master list', 'error');
      return false;
    }

    const previousRemaining = targetTool.remainingLifespan;
    const newRemaining = Math.max(0, previousRemaining - data.quantity);
    const newConsumed = targetTool.consumedLifespan + data.quantity;
    const newCondition = calculateLifespanCondition(targetTool.maxLifespan, newRemaining);

    // Create entry
    const entryId = `CNS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: ConsumptionEntry = {
      id: entryId,
      toolId: targetTool.id,
      toolName: targetTool.itemName,
      machineId: data.machineId,
      machineCode: targetMachine ? targetMachine.code : data.machineId,
      productionDate: data.productionDate,
      shiftId: data.shiftId,
      shiftName: targetShift ? targetShift.name : 'Standard Shift',
      quantity: data.quantity,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      timestamp: new Date().toISOString(),
      entryType: 'normal',
      reason: data.reason,
      previousRemaining,
      newRemaining
    };

    // Update tool
    setTools(prev => prev.map(t => {
      if (t.id === data.toolId) {
        return {
          ...t,
          consumedLifespan: newConsumed,
          remainingLifespan: newRemaining,
          lifespanCondition: newCondition,
          lastConsumptionDate: data.productionDate
        };
      }
      return t;
    }));

    setConsumptions(prev => [newEntry, ...prev]);

    // Log user activity
    logActivity({
      actionType: 'shift_consumption',
      actionLabel: 'Shift Consumption Entry',
      category: 'consumption',
      severity: newCondition === 'critical' ? 'warning' : 'info',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      workstation: `WS-${data.machineId}`,
      targetEntityId: targetTool.id,
      targetEntityType: 'tool',
      summary: `Recorded ${data.quantity.toLocaleString()} strokes on ${targetTool.id} (${data.machineId})`,
      reason: data.reason || 'Normal shift production cycle',
      details: {
        toolId: targetTool.id,
        toolName: targetTool.itemName,
        machineId: data.machineId,
        machineCode: targetMachine ? targetMachine.code : data.machineId,
        shiftId: data.shiftId,
        shiftName: targetShift ? targetShift.name : 'Shift',
        previousValue: previousRemaining,
        newValue: newRemaining,
        delta: data.quantity
      }
    });

    // If remaining is critical, notify
    if (newCondition === 'critical') {
      showToast(
        `Critical Lifespan Alert: Tool ${targetTool.id} has only ${newRemaining.toLocaleString()} strokes remaining. Replacement required!`, 
        'warning', 
        'Lifespan Alert'
      );
    } else {
      showToast(
        `Consumption of ${data.quantity.toLocaleString()} recorded for ${targetTool.id}. Remaining: ${newRemaining.toLocaleString()} strokes`, 
        'success'
      );
    }

    return true;
  };

  // 2. Resolve Missed Entry (Supervisor)
  const resolveMissedEntry = (alertId: string, quantity: number, reason: string): boolean => {
    const alert = missedAlerts.find(a => a.id === alertId);
    if (!alert) return false;

    const targetTool = tools.find(t => t.id === alert.toolId);
    if (!targetTool) return false;

    const previousRemaining = targetTool.remainingLifespan;
    const newRemaining = Math.max(0, previousRemaining - quantity);
    const newConsumed = targetTool.consumedLifespan + quantity;
    const newCondition = calculateLifespanCondition(targetTool.maxLifespan, newRemaining);

    const entryId = `CNS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: ConsumptionEntry = {
      id: entryId,
      toolId: alert.toolId,
      toolName: alert.toolName,
      machineId: alert.machineId,
      machineCode: alert.machineCode,
      productionDate: alert.date,
      shiftId: alert.shiftId,
      shiftName: alert.shiftName,
      quantity,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      timestamp: new Date().toISOString(),
      entryType: 'supervisor_missed',
      reason: reason || 'Missed shift entry captured by supervisor',
      previousRemaining,
      newRemaining,
      supervisorId: currentUser.id,
      supervisorName: currentUser.name
    };

    setTools(prev => prev.map(t => {
      if (t.id === alert.toolId) {
        return {
          ...t,
          consumedLifespan: newConsumed,
          remainingLifespan: newRemaining,
          lifespanCondition: newCondition,
          lastConsumptionDate: alert.date
        };
      }
      return t;
    }));

    setConsumptions(prev => [newEntry, ...prev]);

    setMissedAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          isResolved: true,
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUser.name
        };
      }
      return a;
    }));

    // Log supervisor missed entry resolution
    logActivity({
      actionType: 'missed_resolution',
      actionLabel: 'Missed Shift Reconciled',
      category: 'consumption',
      severity: 'info',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      workstation: `SUP-TERM-${alert.machineCode}`,
      targetEntityId: alert.toolId,
      targetEntityType: 'tool',
      summary: `Resolved missed entry for ${alert.toolId}: ${quantity.toLocaleString()} strokes added`,
      reason: reason || 'Missed shift entry captured by supervisor',
      details: {
        toolId: alert.toolId,
        toolName: alert.toolName,
        machineId: alert.machineId,
        machineCode: alert.machineCode,
        shiftId: alert.shiftId,
        shiftName: alert.shiftName,
        previousValue: previousRemaining,
        newValue: newRemaining,
        delta: quantity
      }
    });

    showToast(`Missed consumption resolved for ${alert.toolId} (${quantity.toLocaleString()} strokes)`, 'success');
    return true;
  };

  // 3. Admin Consumption Override
  const applyAdminOverride = (data: {
    toolId: string;
    machineId: string;
    productionDate: string;
    shiftId: string;
    quantity: number;
    reason: string;
  }): boolean => {
    const targetTool = tools.find(t => t.id === data.toolId);
    const targetMachine = machines.find(m => m.id === data.machineId);
    const targetShift = shifts.find(s => s.id === data.shiftId);

    if (!targetTool) return false;

    const previousRemaining = targetTool.remainingLifespan;
    const newRemaining = Math.max(0, previousRemaining - data.quantity);
    const newConsumed = targetTool.consumedLifespan + data.quantity;
    const newCondition = calculateLifespanCondition(targetTool.maxLifespan, newRemaining);

    const entryId = `CNS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: ConsumptionEntry = {
      id: entryId,
      toolId: targetTool.id,
      toolName: targetTool.itemName,
      machineId: data.machineId,
      machineCode: targetMachine ? targetMachine.code : data.machineId,
      productionDate: data.productionDate,
      shiftId: data.shiftId,
      shiftName: targetShift ? targetShift.name : 'Production Shift',
      quantity: data.quantity,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: 'admin',
      timestamp: new Date().toISOString(),
      entryType: 'admin_override',
      reason: data.reason,
      previousRemaining,
      newRemaining
    };

    setTools(prev => prev.map(t => {
      if (t.id === data.toolId) {
        return {
          ...t,
          consumedLifespan: newConsumed,
          remainingLifespan: newRemaining,
          lifespanCondition: newCondition,
          lastConsumptionDate: data.productionDate
        };
      }
      return t;
    }));

    setConsumptions(prev => [newEntry, ...prev]);

    // Log admin override
    logActivity({
      actionType: 'admin_override',
      actionLabel: 'Admin Consumption Override',
      category: 'override',
      severity: 'warning',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: 'admin',
      workstation: 'ADM-PORTAL-01',
      targetEntityId: targetTool.id,
      targetEntityType: 'tool',
      summary: `Admin override applied on ${targetTool.id}: ${data.quantity.toLocaleString()} strokes`,
      reason: data.reason,
      details: {
        toolId: targetTool.id,
        toolName: targetTool.itemName,
        machineId: data.machineId,
        machineCode: targetMachine ? targetMachine.code : data.machineId,
        shiftId: data.shiftId,
        shiftName: targetShift ? targetShift.name : 'Production Shift',
        previousValue: previousRemaining,
        newValue: newRemaining,
        delta: data.quantity
      }
    });

    showToast(`Admin override applied for ${data.toolId}: ${data.quantity.toLocaleString()} strokes`, 'success');
    return true;
  };

  // 4. Bulk Zero-Consumption Management (Sunday / Line maintenance)
  const applyBulkZeroConsumption = (payload: BulkZeroConsumptionPayload): boolean => {
    const qty = payload.overrideType === 'zero_consumption' ? 0 : (payload.commonValue || 0);
    const newEntries: ConsumptionEntry[] = [];

    setTools(prev => prev.map(t => {
      if (payload.toolIds.includes(t.id)) {
        const prevRem = t.remainingLifespan;
        const newRem = Math.max(0, prevRem - qty);
        const newCons = t.consumedLifespan + qty;
        const newCond = calculateLifespanCondition(t.maxLifespan, newRem);

        const targetMachine = machines.find(m => m.id === t.primaryMachineId);
        newEntries.push({
          id: `CNS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          toolId: t.id,
          toolName: t.itemName,
          machineId: t.primaryMachineId,
          machineCode: targetMachine ? targetMachine.code : t.primaryMachineId,
          productionDate: payload.productionDate,
          shiftId: 'shift-1',
          shiftName: 'All Production Shifts',
          quantity: qty,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: 'admin',
          timestamp: new Date().toISOString(),
          entryType: payload.overrideType === 'zero_consumption' ? 'bulk_zero' : 'admin_override',
          reason: payload.reason || (payload.overrideType === 'zero_consumption' ? 'Scheduled non-working / zero consumption' : 'Bulk batch update'),
          previousRemaining: prevRem,
          newRemaining: newRem
        });

        return {
          ...t,
          consumedLifespan: newCons,
          remainingLifespan: newRem,
          lifespanCondition: newCond,
          lastConsumptionDate: payload.productionDate
        };
      }
      return t;
    }));

    setConsumptions(prev => [...newEntries, ...prev]);

    // Log bulk zero/common consumption operation
    logActivity({
      actionType: 'bulk_zero',
      actionLabel: 'Bulk Zero-Consumption Applied',
      category: 'admin',
      severity: 'info',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: 'admin',
      workstation: 'ADM-PORTAL-01',
      targetEntityId: `${payload.toolIds.length} Tools Batch`,
      targetEntityType: 'tool',
      summary: `Bulk ${payload.overrideType === 'zero_consumption' ? 'Zero-Consumption' : 'Fixed-Value'} applied to ${payload.toolIds.length} tools for ${payload.productionDate}`,
      reason: payload.reason || 'Scheduled non-working / preventative maintenance',
      details: {
        affectedCount: payload.toolIds.length,
        meta: { toolIds: payload.toolIds, overrideType: payload.overrideType, commonValue: payload.commonValue }
      }
    });

    showToast(
      `Bulk operation completed: ${payload.toolIds.length} tools updated for ${payload.productionDate}`, 
      'success'
    );
    return true;
  };

  // 5. Tool Replacement (Old tool archived, new tool initialized with 0 consumption)
  const replaceTool = (payload: ToolReplacementPayload): boolean => {
    const oldTool = tools.find(t => t.id === payload.oldToolId);
    if (!oldTool) {
      showToast('Existing tool not found', 'error');
      return false;
    }

    if (tools.some(t => t.id.toLowerCase() === payload.newToolId.trim().toLowerCase())) {
      showToast(`A tool with ID ${payload.newToolId} already exists! Please use a unique identifier.`, 'error');
      return false;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Create the replacement tool
    const newTool: Tool = {
      id: payload.newToolId.trim(),
      productCode: payload.productCode || oldTool.productCode,
      itemName: payload.itemName || oldTool.itemName,
      description: payload.description || `Replacement for ${oldTool.id}. ${oldTool.description}`,
      recipeNumber: payload.recipeNumber || oldTool.recipeNumber,
      toolCost: payload.toolCost || oldTool.toolCost,
      machineIds: [payload.machineId || oldTool.primaryMachineId],
      primaryMachineId: payload.machineId || oldTool.primaryMachineId,
      maxLifespan: payload.maxLifespan || oldTool.maxLifespan,
      consumedLifespan: 0,
      remainingLifespan: payload.maxLifespan || oldTool.maxLifespan,
      lifespanCondition: 'healthy',
      status: 'active',
      onboardingDate: todayStr,
      replacedFromToolId: oldTool.id,
      notes: `Replaced ${oldTool.id} on ${todayStr}. Reason: ${payload.reason}`
    };

    // Update old tool: mark as replaced, reference new tool
    setTools(prev => [
      newTool,
      ...prev.map(t => {
        if (t.id === oldTool.id) {
          return {
            ...t,
            status: 'replaced' as const,
            replacedByToolId: newTool.id,
            replacementDate: todayStr,
            notes: `${t.notes || ''} [Replaced by ${newTool.id} on ${todayStr}]`.trim()
          };
        }
        return t;
      })
    ]);

    // Update machines active tool list: replace old tool with new tool
    setMachines(prev => prev.map(m => {
      if (m.id === oldTool.primaryMachineId || m.id === payload.machineId) {
        const filtered = m.activeToolIds.filter(id => id !== oldTool.id);
        return {
          ...m,
          activeToolIds: [...filtered, newTool.id]
        };
      }
      return m;
    }));

    // Log tool replacement & archival
    logActivity({
      actionType: 'tool_replacement',
      actionLabel: 'Tool Replacement & Archival',
      category: 'tooling',
      severity: 'critical',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      workstation: 'ADM-PORTAL-01',
      targetEntityId: oldTool.id,
      targetEntityType: 'tool',
      summary: `Replaced tool ${oldTool.id} with new tool ${newTool.id}`,
      reason: payload.reason,
      details: {
        replacedToolId: oldTool.id,
        newToolId: newTool.id,
        toolName: newTool.itemName,
        machineId: payload.machineId || oldTool.primaryMachineId,
        maxLifespan: newTool.maxLifespan,
        previousValue: oldTool.remainingLifespan,
        newValue: newTool.maxLifespan
      }
    });

    showToast(
      `Tool replaced successfully: ${oldTool.id} replaced by ${newTool.id}. Baseline lifespan set to ${newTool.maxLifespan.toLocaleString()} strokes.`,
      'success',
      'Tool Replacement Complete'
    );

    return true;
  };

  // 6. Tool Registration
  const registerTool = (data: {
    id: string;
    productCode: string;
    itemName: string;
    description: string;
    recipeNumber: string;
    toolCost: number;
    machineIds: string[];
    primaryMachineId: string;
    maxLifespan: number;
    initialUsedLifespan?: number;
    notes?: string;
  }): { success: boolean; error?: string } => {
    // Role authorization guard: Setters cannot register new tools, only edit existing ones
    if (activeRole === 'setter') {
      showToast('Tool Setters are only permitted to edit existing tools. Adding new tools requires Administrator privileges.', 'error', 'Permission Denied');
      return { 
        success: false, 
        error: 'Permission Denied: Tool Setters cannot register new tools. Setter authorization is strictly limited to editing existing tools.' 
      };
    }

    const cleanId = data.id.trim();
    if (tools.some(t => t.id.toLowerCase() === cleanId.toLowerCase())) {
      return { success: false, error: `Tool identifier "${cleanId}" already exists in the system!` };
    }

    const used = Math.min(data.maxLifespan, Math.max(0, data.initialUsedLifespan || 0));
    const remaining = data.maxLifespan - used;
    const condition = calculateLifespanCondition(data.maxLifespan, remaining);
    const todayStr = new Date().toISOString().split('T')[0];

    const newTool: Tool = {
      id: cleanId,
      productCode: data.productCode.trim(),
      itemName: data.itemName.trim(),
      description: data.description.trim(),
      recipeNumber: data.recipeNumber.trim(),
      toolCost: Number(data.toolCost) || 0,
      machineIds: data.machineIds.length > 0 ? data.machineIds : [data.primaryMachineId],
      primaryMachineId: data.primaryMachineId,
      maxLifespan: Number(data.maxLifespan),
      consumedLifespan: used,
      remainingLifespan: remaining,
      lifespanCondition: condition,
      status: 'active',
      onboardingDate: todayStr,
      notes: data.notes
    };

    setTools(prev => [newTool, ...prev]);

    // Add to machine active list
    if (data.primaryMachineId) {
      setMachines(prev => prev.map(m => {
        if (m.id === data.primaryMachineId && !m.activeToolIds.includes(newTool.id)) {
          return {
            ...m,
            activeToolIds: [...m.activeToolIds, newTool.id]
          };
        }
        return m;
      }));
    }

    // Log tool registration
    logActivity({
      actionType: 'tool_registration',
      actionLabel: 'New Tool Registered',
      category: 'tooling',
      severity: 'success',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      workstation: 'ADM-PORTAL-01',
      targetEntityId: newTool.id,
      targetEntityType: 'tool',
      summary: `Registered new tool ${newTool.id} (${newTool.productCode}) on ${data.primaryMachineId}`,
      reason: data.notes || 'Tool commissioned for production',
      details: {
        toolId: newTool.id,
        toolName: newTool.itemName,
        machineId: data.primaryMachineId,
        maxLifespan: newTool.maxLifespan,
        previousValue: 0,
        newValue: newTool.maxLifespan
      }
    });

    showToast(`Tool ${newTool.id} registered and associated with ${data.primaryMachineId}`, 'success');
    return { success: true };
  };

  const updateTool = (updated: Tool) => {
    const existing = tools.find(t => t.id === updated.id);
    if (!existing) {
      showToast('Tool not found', 'error');
      return;
    }

    setTools(prev => prev.map(t => t.id === updated.id ? updated : t));

    // Keep drawer in sync if open
    if (selectedToolForDrawer && selectedToolForDrawer.id === updated.id) {
      setSelectedToolForDrawer(updated);
    }

    // If primary machine was changed, update machine active tool assignments
    if (existing.primaryMachineId !== updated.primaryMachineId) {
      setMachines(prev => prev.map(m => {
        if (m.id === existing.primaryMachineId) {
          return {
            ...m,
            activeToolIds: m.activeToolIds.filter(id => id !== updated.id)
          };
        }
        if (m.id === updated.primaryMachineId) {
          return {
            ...m,
            activeToolIds: m.activeToolIds.includes(updated.id) ? m.activeToolIds : [...m.activeToolIds, updated.id]
          };
        }
        return m;
      }));
    }

    // Log tool editing activity
    logActivity({
      actionType: 'master_data_update',
      actionLabel: activeRole === 'setter' ? 'Tool Edited by Setter' : 'Tool Specifications Updated',
      category: 'tooling',
      severity: 'info',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      workstation: activeRole === 'setter' ? 'WS-SETTER-BENCH' : 'ADM-PORTAL-01',
      targetEntityId: updated.id,
      targetEntityType: 'tool',
      summary: `${currentUser.name} (${ROLE_PERMISSIONS[activeRole].label}) edited tool ${updated.id} parameters & recipe ${updated.recipeNumber}`,
      reason: updated.notes || 'Tool setup and parameter adjustments',
      details: {
        toolId: updated.id,
        toolName: updated.itemName,
        machineId: updated.primaryMachineId,
        meta: {
          productCode: updated.productCode,
          recipeNumber: updated.recipeNumber,
          toolCost: updated.toolCost,
          status: updated.status,
          notes: updated.notes
        }
      }
    });

    showToast(`Tool ${updated.id} configuration updated successfully`, 'success', 'Tool Updated');
  };

  // 7. Correct Consumption Entry
  const correctConsumption = (data: {
    entryId: string;
    correctedQuantity: number;
    reason: string;
  }): boolean => {
    const entry = consumptions.find(c => c.id === data.entryId);
    if (!entry) return false;

    const delta = data.correctedQuantity - entry.quantity;
    const targetTool = tools.find(t => t.id === entry.toolId);

    if (targetTool) {
      const newRemaining = Math.max(0, targetTool.remainingLifespan - delta);
      const newConsumed = Math.max(0, targetTool.consumedLifespan + delta);
      const newCondition = calculateLifespanCondition(targetTool.maxLifespan, newRemaining);

      setTools(prev => prev.map(t => {
        if (t.id === targetTool.id) {
          return {
            ...t,
            consumedLifespan: newConsumed,
            remainingLifespan: newRemaining,
            lifespanCondition: newCondition
          };
        }
        return t;
      }));
    }

    // Update entry
    setConsumptions(prev => prev.map(c => {
      if (c.id === data.entryId) {
        return {
          ...c,
          quantity: data.correctedQuantity,
          entryType: 'correction',
          reason: `Corrected from ${c.quantity} to ${data.correctedQuantity}. Reason: ${data.reason}`,
          timestamp: new Date().toISOString()
        };
      }
      return c;
    }));

    // Record audit correction
    const newCorrection: CorrectionRecord = {
      id: `CORR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      originalEntryId: data.entryId,
      toolId: entry.toolId,
      machineId: entry.machineId,
      productionDate: entry.productionDate,
      shiftId: entry.shiftId,
      originalQuantity: entry.quantity,
      correctedQuantity: data.correctedQuantity,
      delta,
      reason: data.reason,
      requestedBy: currentUser.name,
      approvedBy: activeRole === 'admin' ? currentUser.name : 'Pending Supervisor Approval',
      timestamp: new Date().toISOString(),
      status: 'approved'
    };

    setCorrections(prev => [newCorrection, ...prev]);

    // Log consumption correction in activity audit trail
    logActivity({
      actionType: 'consumption_correction',
      actionLabel: 'Consumption Correction',
      category: 'consumption',
      severity: 'warning',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: activeRole,
      workstation: 'SUP-AUDIT-DESK',
      targetEntityId: entry.toolId,
      targetEntityType: 'tool',
      summary: `Corrected consumption on ${entry.toolId} from ${entry.quantity.toLocaleString()} to ${data.correctedQuantity.toLocaleString()} (${delta >= 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} strokes)`,
      reason: data.reason,
      details: {
        toolId: entry.toolId,
        toolName: entry.toolName,
        machineId: entry.machineId,
        machineCode: entry.machineCode,
        shiftId: entry.shiftId,
        shiftName: entry.shiftName,
        previousValue: entry.quantity,
        newValue: data.correctedQuantity,
        delta: delta
      }
    });

    showToast(`Consumption entry ${data.entryId} corrected (Delta: ${delta > 0 ? `+${delta}` : delta})`, 'success');
    return true;
  };

  // 8. Master Data Administrative Handlers
  const addMachine = (data: Omit<Machine, 'activeToolIds'>): boolean => {
    if (machines.some(m => m.code.toLowerCase() === data.code.trim().toLowerCase())) {
      showToast(`Machine code ${data.code} already exists`, 'error');
      return false;
    }
    const newMachine: Machine = {
      ...data,
      id: data.code.trim(),
      code: data.code.trim(),
      activeToolIds: []
    };
    setMachines(prev => [...prev, newMachine]);
    showToast(`Machine ${newMachine.code} added`, 'success');
    return true;
  };

  const updateMachine = (machine: Machine) => {
    setMachines(prev => prev.map(m => m.id === machine.id ? machine : m));
    showToast(`Machine ${machine.code} updated`, 'info');
  };

  const toggleMachineStatus = (machineId: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        const nextStatus = m.status === 'active' ? 'maintenance' : m.status === 'maintenance' ? 'inactive' : 'active';
        showToast(`Machine ${m.code} marked as ${nextStatus.toUpperCase()}`, 'info');
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  const addUser = (userData: Omit<User, 'id'>): boolean => {
    const id = `USR-${userData.role.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newUser: User = {
      ...userData,
      id
    };
    setUsers(prev => [...prev, newUser]);
    showToast(`User ${newUser.name} added as ${newUser.role.toUpperCase()}`, 'success');
    return true;
  };

  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    showToast(`User ${user.name} updated`, 'info');
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        showToast(`User ${u.name} set to ${nextStatus.toUpperCase()}`, 'info');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const updateShift = (shift: Shift) => {
    setShifts(prev => prev.map(s => s.id === shift.id ? shift : s));
    showToast(`Shift ${shift.name} timing updated`, 'info');
  };

  // 9. Excel Upload Handler
  const importMasterData = (type: 'users' | 'machines' | 'tools', importedData: any[]) => {
    let successCount = 0;
    let errorCount = 0;

    if (type === 'machines') {
      const newItems: Machine[] = [];
      importedData.forEach(row => {
        if (!row.code || !row.name) {
          errorCount++;
          return;
        }
        const exists = machines.some(m => m.code.toLowerCase() === row.code.toString().trim().toLowerCase());
        if (exists) {
          errorCount++;
          return;
        }
        newItems.push({
          id: row.code.toString().trim(),
          code: row.code.toString().trim(),
          name: row.name.toString().trim(),
          location: row.location || 'Bay 1 - Main Floor',
          bay: row.bay || 'Bay 1',
          status: 'active',
          installedDate: row.installedDate || new Date().toISOString().split('T')[0],
          activeToolIds: []
        });
        successCount++;
      });
      if (newItems.length > 0) {
        setMachines(prev => [...prev, ...newItems]);
      }
    } else if (type === 'tools') {
      const newItems: Tool[] = [];
      importedData.forEach(row => {
        if (!row.id || !row.itemName || !row.maxLifespan) {
          errorCount++;
          return;
        }
        const exists = tools.some(t => t.id.toLowerCase() === row.id.toString().trim().toLowerCase());
        if (exists) {
          errorCount++;
          return;
        }
        const maxL = Number(row.maxLifespan) || 50000;
        const used = Number(row.initialUsedLifespan) || 0;
        const remaining = Math.max(0, maxL - used);
        newItems.push({
          id: row.id.toString().trim(),
          productCode: row.productCode || 'AUTO-PART',
          itemName: row.itemName.toString().trim(),
          description: row.description || '',
          recipeNumber: row.recipeNumber || 'RCP-STD',
          toolCost: Number(row.toolCost) || 35000,
          machineIds: [row.primaryMachineId || 'MC-STAMP-01'],
          primaryMachineId: row.primaryMachineId || 'MC-STAMP-01',
          maxLifespan: maxL,
          consumedLifespan: used,
          remainingLifespan: remaining,
          lifespanCondition: calculateLifespanCondition(maxL, remaining),
          status: 'active',
          onboardingDate: new Date().toISOString().split('T')[0]
        });
        successCount++;
      });
      if (newItems.length > 0) {
        setTools(prev => [...newItems, ...prev]);
      }
    } else if (type === 'users') {
      const newItems: User[] = [];
      importedData.forEach(row => {
        if (!row.name || !row.role) {
          errorCount++;
          return;
        }
        newItems.push({
          id: `USR-${row.role.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          employeeId: row.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          name: row.name.toString().trim(),
          role: row.role.toLowerCase() as UserRole,
          status: 'active',
          shiftId: row.shiftId || 'shift-1',
          email: row.email || `${row.name.toLowerCase().replace(/\s+/g, '.')}@rosenberger.in`
        });
        successCount++;
      });
      if (newItems.length > 0) {
        setUsers(prev => [...prev, ...newItems]);
      }
    }

    // Log master data import
    if (successCount > 0) {
      logActivity({
        actionType: 'master_data_update',
        actionLabel: 'Master Data Import',
        category: 'admin',
        severity: 'success',
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: activeRole,
        workstation: 'ADM-PORTAL-01',
        targetEntityId: `${type.toUpperCase()}-DATA`,
        targetEntityType: 'system',
        summary: `Imported ${successCount} ${type} records via batch upload (${errorCount} errors)`,
        reason: 'Master data batch update',
        details: {
          affectedCount: successCount,
          meta: { type, rejected: errorCount }
        }
      });
    }

    showToast(`Master data import completed: ${successCount} imported, ${errorCount} rejected.`, successCount > 0 ? 'success' : 'warning');
    return { successCount, errorCount };
  };

  const resetToDefaults = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}tools`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}machines`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}shifts`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}users`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}consumptions`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}missedAlerts`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}corrections`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}activityLogs`);

    setTools(INITIAL_TOOLS);
    setMachines(INITIAL_MACHINES);
    setShifts(INITIAL_SHIFTS);
    setUsers(INITIAL_USERS);
    setConsumptions(INITIAL_CONSUMPTIONS);
    setMissedAlerts(INITIAL_MISSED_ALERTS);
    setCorrections(INITIAL_CORRECTIONS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);

    showToast('Reset factory database to default seed records', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        tools,
        machines,
        shifts,
        users,
        consumptions,
        missedAlerts,
        corrections,
        activityLogs,
        activeRole,
        currentUser,
        currentView,
        toasts,
        selectedToolForDrawer,
        isSidebarCollapsed,
        toggleSidebar,
        setActiveRole,
        setCurrentView,
        setSelectedToolForDrawer,
        showToast,
        dismissToast,
        logActivity,
        clearActivityLogs,
        recordConsumption,
        resolveMissedEntry,
        applyAdminOverride,
        applyBulkZeroConsumption,
        replaceTool,
        registerTool,
        updateTool,
        correctConsumption,
        addMachine,
        updateMachine,
        toggleMachineStatus,
        addUser,
        updateUser,
        toggleUserStatus,
        updateShift,
        importMasterData,
        resetToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
