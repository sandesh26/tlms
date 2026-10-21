import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { Machine, User, Shift, UserRole } from '../../types';
import { 
  Database, 
  Cpu, 
  Users, 
  Clock, 
  FileSpreadsheet, 
  Plus, 
  Check, 
  AlertCircle, 
  Download, 
  Upload, 
  Trash2, 
  Edit2, 
  X,
  FileCheck2,
  FileX2,
  HelpCircle
} from 'lucide-react';

export const MasterDataAdminView: React.FC = () => {
  const { 
    machines, 
    addMachine, 
    toggleMachineStatus,
    users, 
    addUser, 
    toggleUserStatus,
    shifts, 
    updateShift,
    tools,
    importMasterData,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'machines' | 'users' | 'shifts' | 'excel_upload'>('machines');

  // New machine modal
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [newMachineCode, setNewMachineCode] = useState('');
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineLocation, setNewMachineLocation] = useState('Bay 1 - Precision Stamping');
  const [newMachineBay, setNewMachineBay] = useState('Bay 1');

  // New user modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('operator');
  const [newUserShiftId, setNewUserShiftId] = useState('shift-1');
  const [newUserSupervisorId, setNewUserSupervisorId] = useState('USR-SUP-01');

  // Excel Upload states
  const [excelTargetType, setExcelTargetType] = useState<'tools' | 'machines' | 'users'>('tools');
  const [excelRawInput, setExcelRawInput] = useState<string>('');
  const [parsedPreviewRows, setParsedPreviewRows] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);

  // Machine submit
  const handleAddMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineCode.trim() || !newMachineName.trim()) {
      showToast('Please fill all required machine fields', 'error');
      return;
    }
    const success = addMachine({
      id: newMachineCode.trim().toUpperCase(),
      code: newMachineCode.trim().toUpperCase(),
      name: newMachineName.trim(),
      location: newMachineLocation.trim(),
      bay: newMachineBay.trim(),
      status: 'active',
      installedDate: new Date().toISOString().split('T')[0]
    });
    if (success) {
      setShowAddMachineModal(false);
      setNewMachineCode('');
      setNewMachineName('');
    }
  };

  // User submit
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmpId.trim()) {
      showToast('Please fill in user name and employee ID', 'error');
      return;
    }
    const success = addUser({
      name: newUserName.trim(),
      employeeId: newUserEmpId.trim().toUpperCase(),
      role: newUserRole,
      status: 'active',
      shiftId: newUserShiftId,
      supervisorId: newUserRole === 'operator' ? newUserSupervisorId : undefined,
      email: `${newUserName.toLowerCase().replace(/\s+/g, '.')}@rosenberger.in`
    });
    if (success) {
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmpId('');
    }
  };

  // Sample CSV templates generator
  const handleDownloadSample = (type: 'tools' | 'machines' | 'users') => {
    let csvData = '';
    let filename = '';

    if (type === 'tools') {
      csvData = 'id,productCode,itemName,description,recipeNumber,toolCost,primaryMachineId,maxLifespan,initialUsedLifespan\n' +
        'TL-CR-4099,FAKRA-GEN4-Z,Outer Ferrule Hex Die 0.5mm,High tensile crimping die,RCP-9941-B,42000,MC-CRIMP-02,80000,0\n' +
        'TL-PN-1180,HSD-CONN-4P,Terminal Pin Stamping Punch,Precision tungsten punch,RCP-2026-A4,58000,MC-STAMP-01,90000,5000\n' +
        'TL-BL-3350,CBL-STRP-COAX,Rotary Stripper Blade Pair,Coaxial cable prep blades,RCP-STRIP-08,19000,MC-STAMP-01,35000,0';
      filename = 'Rosenberger_Tool_Master_Template.csv';
    } else if (type === 'machines') {
      csvData = 'code,name,location,bay,installedDate\n' +
        'MC-CRIMP-07,Mecal Automatic Crimp Applicator 7,Bay 2 - Automotive RF,Bay 2,2026-01-15\n' +
        'MC-STAMP-08,Bruderer 30T High Speed Press,Bay 1 - Precision Stamping,Bay 1,2026-02-10';
      filename = 'Rosenberger_Machine_Master_Template.csv';
    } else {
      csvData = 'employeeId,name,role,shiftId,email\n' +
        'EMP-5044,Ganesh Prabhu,operator,shift-1,ganesh.p@rosenberger.in\n' +
        'EMP-7033,Sunil Dessai,setter,shift-2,sunil.d@rosenberger.in';
      filename = 'Rosenberger_User_Master_Template.csv';
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvData);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded sample template for ${type.toUpperCase()}`, 'info');
  };

  // Load preset sample into raw text area
  const handleLoadSampleIntoEditor = () => {
    if (excelTargetType === 'tools') {
      setExcelRawInput(
        'id,productCode,itemName,description,recipeNumber,toolCost,primaryMachineId,maxLifespan,initialUsedLifespan\n' +
        'TL-CR-4099,FAKRA-GEN4-Z,Outer Ferrule Hex Die 0.5mm,High tensile crimping die,RCP-9941-B,42000,MC-CRIMP-02,80000,0\n' +
        'TL-PN-1180,HSD-CONN-4P,Terminal Pin Stamping Punch,Precision tungsten punch,RCP-2026-A4,58000,MC-STAMP-01,90000,5000\n' +
        'TL-BL-3350,CBL-STRP-COAX,Rotary Stripper Blade Pair,Coaxial cable prep blades,RCP-STRIP-08,19000,MC-STAMP-01,35000,0'
      );
    } else if (excelTargetType === 'machines') {
      setExcelRawInput(
        'code,name,location,bay,installedDate\n' +
        'MC-CRIMP-07,Mecal Automatic Crimp Applicator 7,Bay 2 - Automotive RF,Bay 2,2026-01-15\n' +
        'MC-STAMP-08,Bruderer 30T High Speed Press,Bay 1 - Precision Stamping,Bay 1,2026-02-10'
      );
    } else {
      setExcelRawInput(
        'employeeId,name,role,shiftId,email\n' +
        'EMP-5044,Ganesh Prabhu,operator,shift-1,ganesh.p@rosenberger.in\n' +
        'EMP-7033,Sunil Dessai,setter,shift-2,sunil.d@rosenberger.in'
      );
    }
    setIsValidated(false);
  };

  // Validate uploaded / entered CSV
  const handleValidateInput = () => {
    if (!excelRawInput.trim()) {
      showToast('Please paste or upload CSV data first', 'error');
      return;
    }

    const lines = excelRawInput.trim().split('\n');
    if (lines.length < 2) {
      showToast('File must include a header row and at least 1 data row', 'error');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map(v => v.trim());
      const rowObj: any = { _rowNum: i + 1, _isValid: true, _errors: [] };

      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });

      // Validations
      if (excelTargetType === 'tools') {
        if (!rowObj.id) {
          rowObj._isValid = false;
          rowObj._errors.push('Missing Tool ID');
        } else if (tools.some(t => t.id.toLowerCase() === rowObj.id.toLowerCase())) {
          rowObj._isValid = false;
          rowObj._errors.push(`Tool ID "${rowObj.id}" already exists`);
        }
        if (!rowObj.itemName) {
          rowObj._isValid = false;
          rowObj._errors.push('Missing Item Name');
        }
        if (!rowObj.maxLifespan || isNaN(Number(rowObj.maxLifespan))) {
          rowObj._isValid = false;
          rowObj._errors.push('Invalid max lifespan');
        }
      } else if (excelTargetType === 'machines') {
        if (!rowObj.code) {
          rowObj._isValid = false;
          rowObj._errors.push('Missing Machine Code');
        } else if (machines.some(m => m.code.toLowerCase() === rowObj.code.toLowerCase())) {
          rowObj._isValid = false;
          rowObj._errors.push(`Machine "${rowObj.code}" already exists`);
        }
        if (!rowObj.name) {
          rowObj._isValid = false;
          rowObj._errors.push('Missing Machine Name');
        }
      } else if (excelTargetType === 'users') {
        if (!rowObj.name) {
          rowObj._isValid = false;
          rowObj._errors.push('Missing User Name');
        }
        if (!['operator', 'setter', 'supervisor', 'admin'].includes((rowObj.role || '').toLowerCase())) {
          rowObj._isValid = false;
          rowObj._errors.push('Invalid role (must be operator, setter, supervisor, or admin)');
        }
      }

      if (!rowObj._isValid) {
        errors.push(`Row ${rowObj._rowNum}: ${rowObj._errors.join(', ')}`);
      }
      rows.push(rowObj);
    }

    setParsedPreviewRows(rows);
    setUploadErrors(errors);
    setIsValidated(true);
    showToast(`Parsed ${rows.length} rows (${rows.filter(r => r._isValid).length} valid, ${errors.length} invalid)`, errors.length > 0 ? 'warning' : 'success');
  };

  // Commit valid rows
  const handleCommitUpload = () => {
    const validRows = parsedPreviewRows.filter(r => r._isValid);
    if (validRows.length === 0) {
      showToast('No valid rows to import', 'error');
      return;
    }

    importMasterData(excelTargetType, validRows);
    setExcelRawInput('');
    setParsedPreviewRows([]);
    setIsValidated(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Plant Infrastructure & Configuration
            </span>
            <span className="text-xs text-slate-500 font-mono">TLMS §6 Master Data Administration</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Data Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain machine fleet, factory shifts, user roles, supervisor mappings, and bulk Excel master data imports.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('machines')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'machines' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Machines ({machines.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Roles ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'shifts' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Shifts Config (3)</span>
          </button>
          <button
            onClick={() => setActiveTab('excel_upload')}
            className={`px-3.5 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'excel_upload' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel / CSV Upload</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Machines Management */}
      {activeTab === 'machines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Production Machine Register</h2>
              <p className="text-xs text-slate-500">Stamping presses, automated wire crimp cells, and assembly lines</p>
            </div>
            <button
              onClick={() => setShowAddMachineModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Machine</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Machine Code</th>
                  <th className="px-3 py-3">Machine Name</th>
                  <th className="px-3 py-3">Facility Location</th>
                  <th className="px-3 py-3">Bay</th>
                  <th className="px-3 py-3 text-center">Mounted Tools</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {machines.map(m => {
                  const activeCount = tools.filter(t => t.primaryMachineId === m.id && t.status === 'active').length;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{m.code}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="px-3 py-3 text-slate-600">{m.location}</td>
                      <td className="px-3 py-3 font-mono text-slate-700">{m.bay}</td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                        {activeCount}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleMachineStatus(m.id)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors"
                        >
                          {m.status === 'active' ? 'Set Maintenance' : m.status === 'maintenance' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Users & Roles */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Personnel & Role Assignments</h2>
              <p className="text-xs text-slate-500">Access levels for Operators, Setters, Shift Supervisors, and Administrators</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add User Profile</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-3 py-3">Full Name</th>
                  <th className="px-3 py-3">Assigned Role</th>
                  <th className="px-3 py-3">Shift</th>
                  <th className="px-3 py-3">Supervisor</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {users.map(u => {
                  const shift = shifts.find(s => s.id === u.shiftId);
                  const supervisor = users.find(sup => sup.id === u.supervisorId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{u.employeeId}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs font-bold uppercase text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 font-mono">{shift ? shift.name.split(' ')[0] : 'All'}</td>
                      <td className="px-3 py-3 text-slate-600">{supervisor ? supervisor.name : '---'}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors"
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Shift Configuration */}
      {activeTab === 'shifts' && (
        <div className="space-y-4 max-w-3xl">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Factory Production Shift Structure</h2>
            <p className="text-xs text-slate-500">
              Three standard 8-hour production shifts covering Monday through Saturday (Sunday treated as non-working day under §5.5).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {s.code}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold font-mono">Active Working Shift</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{s.name}</h3>
                  <div className="text-lg font-mono font-bold text-slate-800 mt-1">
                    {s.startTime} – {s.endTime}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">Operating Days:</span> Mon, Tue, Wed, Thu, Fri, Sat
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Sunday Operating Policy:</div>
            <p>
              Sunday is classified as non-working under normal plant calendar. In cases of critical automotive delivery runs,
              authorized administrators record batch Sunday production via the <em>Admin Bulk Zero & Overrides</em> module.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Excel Upload for Master Data */}
      {activeTab === 'excel_upload' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel-Based Master Data Bulk Upload
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  TLMS Spec §6.7: Bulk create master records with column validation, duplicate checking, and error reporting.
                </p>
              </div>

              {/* Target Type Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Upload Target:</label>
                <select
                  value={excelTargetType}
                  onChange={e => {
                    setExcelTargetType(e.target.value as any);
                    setParsedPreviewRows([]);
                    setIsValidated(false);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-900"
                >
                  <option value="tools">Tool List Master (CSV/Excel)</option>
                  <option value="machines">Machine List Master</option>
                  <option value="users">User & Role List</option>
                </select>
              </div>
            </div>

            {/* Template Download & Preset Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Download className="w-4 h-4 text-blue-600" />
                <span>Need formatting reference? Download standard CSV template:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSample(excelTargetType)}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium"
                >
                  Download {excelTargetType.toUpperCase()} Template
                </button>
                <button
                  onClick={handleLoadSampleIntoEditor}
                  className="px-3 py-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold"
                >
                  Load Sample Data into Box
                </button>
              </div>
            </div>

            {/* Textarea or Dropzone for CSV content */}
            <div>
              <div className="flex items-center justify-between mb-1 text-xs font-semibold text-slate-700">
                <span>Paste CSV Data / Spreadsheet Rows:</span>
                <span className="text-[11px] text-slate-400 font-normal">First line must be header matching template</span>
              </div>
              <textarea
                rows={6}
                value={excelRawInput}
                onChange={e => {
                  setExcelRawInput(e.target.value);
                  setIsValidated(false);
                }}
                placeholder="id,productCode,itemName,description,recipeNumber,toolCost,primaryMachineId,maxLifespan,initialUsedLifespan&#10;TL-CR-4099,FAKRA-GEN4-Z,Outer Ferrule Hex Die 0.5mm,High tensile crimping die,RCP-9941-B,42000,MC-CRIMP-02,80000,0"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Validate Button */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleValidateInput}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Validate Columns & Rows</span>
              </button>
            </div>
          </div>

          {/* Validation Report & Commit Stage */}
          {isValidated && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Validation Report</h3>
                  <div className="flex items-center gap-3 text-xs mt-0.5">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      {parsedPreviewRows.filter(r => r._isValid).length} Accepted Rows
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-rose-700 font-semibold flex items-center gap-1">
                      <FileX2 className="w-3.5 h-3.5" />
                      {parsedPreviewRows.filter(r => !r._isValid).length} Rejected Rows
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={parsedPreviewRows.filter(r => r._isValid).length === 0}
                  onClick={handleCommitUpload}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Commit {parsedPreviewRows.filter(r => r._isValid).length} Valid Records</span>
                </button>
              </div>

              {/* Error messages box */}
              {uploadErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Validation Errors Detected:
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {uploadErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              <div className="border border-slate-200 rounded-md overflow-hidden text-xs max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Row #</th>
                      <th className="px-3 py-2">Validation</th>
                      <th className="px-3 py-2">Identifier</th>
                      <th className="px-3 py-2">Name / Details</th>
                      <th className="px-3 py-2">Machine / Association</th>
                      <th className="px-3 py-2">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedPreviewRows.map((row, idx) => (
                      <tr key={idx} className={row._isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                        <td className="px-3 py-2 font-mono font-bold text-slate-500">{row._rowNum}</td>
                        <td className="px-3 py-2">
                          {row._isValid ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              VALID
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              REJECTED
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">
                          {row.id || row.code || row.employeeId || '---'}
                        </td>
                        <td className="px-3 py-2 text-slate-800 truncate max-w-xs">
                          {row.itemName || row.name || '---'}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {row.primaryMachineId || row.location || row.role || '---'}
                        </td>
                        <td className="px-3 py-2 text-rose-600 text-[11px]">
                          {row._errors.join(', ')}
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

      {/* Modal: Add Machine */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMachine}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add Production Machine</h3>
              <button
                type="button"
                onClick={() => setShowAddMachineModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Machine Code (ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MC-CRIMP-05"
                  value={newMachineCode}
                  onChange={e => setNewMachineCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Machine Name / Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mecal P107C Precision Wire Crimp Cell C"
                  value={newMachineName}
                  onChange={e => setNewMachineName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plant Location / Area</label>
                <input
                  type="text"
                  value={newMachineLocation}
                  onChange={e => setNewMachineLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bay Designation</label>
                <input
                  type="text"
                  value={newMachineBay}
                  onChange={e => setNewMachineBay(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddMachineModal(false)}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs"
              >
                Add Machine
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUser}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add Plant User Profile</h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-5088"
                  value={newUserEmpId}
                  onChange={e => setNewUserEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Naik"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Permission</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md"
                >
                  <option value="operator">Operator (Shift Consumption Recording)</option>
                  <option value="setter">Setter (Tooling Setup & Inspection)</option>
                  <option value="supervisor">Shift Supervisor (Missed Entries & Approvals)</option>
                  <option value="admin">Administrator (Master Data & Overrides)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift Assignment</label>
                <select
                  value={newUserShiftId}
                  onChange={e => setNewUserShiftId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md"
                >
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
