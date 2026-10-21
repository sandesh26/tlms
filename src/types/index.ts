export type UserRole = 'operator' | 'setter' | 'supervisor' | 'admin';

export type LifespanStatus = 'healthy' | 'moderate' | 'critical';

export type ToolStatus = 'active' | 'maintenance' | 'replaced' | 'inactive';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  shiftId?: string;
  supervisorId?: string;
  assignedMachineIds?: string[];
  email?: string;
}

export interface Machine {
  id: string;
  code: string; // e.g. MC-STAMP-01
  name: string;
  location: string; // e.g. Bay 1 - Precision Stamping
  bay: string;
  status: 'active' | 'maintenance' | 'inactive';
  installedDate: string;
  activeToolIds: string[];
}

export interface Shift {
  id: string;
  name: string; // e.g. Shift 1 (Morning)
  code: string; // S1
  startTime: string; // 06:00
  endTime: string; // 14:00
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  isActive: boolean;
}

export interface Tool {
  id: string; // Unique Tool Identifier e.g. TL-ST-8821
  productCode: string; // e.g. HSD-CONN-4P
  itemName: string; // e.g. Carbide Crimp Die Set 0.35mm²
  description: string;
  recipeNumber: string; // e.g. RCP-2026-A4
  toolCost: number; // in INR e.g. 48500
  machineIds: string[]; // Supported/Associated machines
  primaryMachineId: string;
  maxLifespan: number; // in strokes/cycles
  consumedLifespan: number;
  remainingLifespan: number;
  lifespanCondition: LifespanStatus;
  status: ToolStatus;
  onboardingDate: string;
  lastConsumptionDate?: string;
  replacedByToolId?: string;
  replacedFromToolId?: string;
  replacementDate?: string;
  notes?: string;
}

export type ConsumptionEntryType = 
  | 'normal' 
  | 'supervisor_missed' 
  | 'admin_override' 
  | 'bulk_zero' 
  | 'correction';

export interface ConsumptionEntry {
  id: string;
  toolId: string;
  toolName: string;
  machineId: string;
  machineCode: string;
  productionDate: string; // YYYY-MM-DD
  shiftId: string;
  shiftName: string;
  quantity: number;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  entryType: ConsumptionEntryType;
  reason?: string;
  previousRemaining: number;
  newRemaining: number;
  supervisorId?: string;
  supervisorName?: string;
}

export interface CorrectionRecord {
  id: string;
  originalEntryId: string;
  toolId: string;
  machineId: string;
  productionDate: string;
  shiftId: string;
  originalQuantity: number;
  correctedQuantity: number;
  delta: number;
  reason: string;
  requestedBy: string;
  approvedBy: string;
  timestamp: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface MissedEntryAlert {
  id: string;
  machineId: string;
  machineCode: string;
  date: string;
  shiftId: string;
  shiftName: string;
  expectedOperatorId?: string;
  expectedOperatorName?: string;
  toolId: string;
  toolName: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface BulkZeroConsumptionPayload {
  productionDate: string;
  toolIds: string[];
  reason: string;
  overrideType: 'zero_consumption' | 'common_value';
  commonValue?: number;
}

export interface ToolReplacementPayload {
  oldToolId: string;
  newToolId: string;
  productCode: string;
  itemName: string;
  description: string;
  recipeNumber: string;
  toolCost: number;
  machineId: string;
  maxLifespan: number;
  reason: string;
}

export interface ExcelImportRow {
  rowNumber: number;
  data: Record<string, any>;
  isValid: boolean;
  errors: string[];
}

export interface ExcelUploadSummary {
  type: 'users' | 'machines' | 'tools';
  fileName: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  rows: ExcelImportRow[];
}

export type ActivityActionType =
  | 'tool_registration'
  | 'admin_override'
  | 'consumption_correction'
  | 'tool_replacement'
  | 'batch_replacement'
  | 'missed_resolution'
  | 'bulk_zero'
  | 'shift_consumption'
  | 'master_data_update';

export type ActivitySeverity = 'info' | 'warning' | 'critical' | 'success';

export interface ActivityLog {
  id: string; // e.g. ACT-2026-1042
  timestamp: string; // ISO string
  actionType: ActivityActionType;
  actionLabel: string; // e.g. 'Tool Registration'
  category: 'tooling' | 'consumption' | 'override' | 'admin';
  severity: ActivitySeverity;
  userId: string;
  userName: string;
  userRole: UserRole;
  workstation?: string;
  targetEntityId: string;
  targetEntityType: 'tool' | 'machine' | 'consumption' | 'user' | 'system';
  summary: string;
  reason?: string;
  details?: {
    toolId?: string;
    toolName?: string;
    machineId?: string;
    machineCode?: string;
    shiftId?: string;
    shiftName?: string;
    previousValue?: number | string;
    newValue?: number | string;
    delta?: number;
    maxLifespan?: number;
    replacedToolId?: string;
    newToolId?: string;
    affectedCount?: number;
    meta?: Record<string, any>;
  };
}
