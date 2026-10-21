import React, { useState, useRef, useEffect } from 'react';
import { useApp, ROLE_PERMISSIONS } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  Shield, 
  Clock, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Calendar,
  ChevronDown,
  Check,
  Sunrise,
  Sun,
  Moon,
  Info
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeRole, 
    setActiveRole, 
    currentUser, 
    shifts,
    isSidebarCollapsed,
    toggleSidebar
  } = useApp();

  // Dropdown visibility states
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);

  // References for outside click dismissal
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const shiftDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) {
        setIsRoleDropdownOpen(false);
      }
      if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(target)) {
        setIsShiftDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRoleDropdownOpen(false);
        setIsShiftDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const roles: { 
    id: UserRole; 
    label: string; 
    title: string; 
    desc: string; 
    badge: string;
    personaName: string;
    personaId: string;
  }[] = [
    { 
      id: 'operator', 
      label: 'Operator', 
      title: 'Machine Operator',
      desc: 'Shift stroke consumption entry only',
      badge: 'Input Scope',
      personaName: 'Sandesh Gaonkar',
      personaId: 'EMP-OPERATOR'
    },
    { 
      id: 'setter', 
      label: 'Setter', 
      title: 'Tool Setter',
      desc: 'Plant dashboard, tooling health, recipe edits & machine setup',
      badge: 'Setup & Health',
      personaName: 'Amit Borkar',
      personaId: 'EMP-SETTER'
    },
    { 
      id: 'supervisor', 
      label: 'Supervisor', 
      title: 'Shift Supervisor',
      desc: 'Missed shift audits, reconciliation & corrections',
      badge: 'Audit Scope',
      personaName: 'Dilip Shenvi',
      personaId: 'EMP-SUPERVISOR'
    },
    { 
      id: 'admin', 
      label: 'Admin', 
      title: 'Plant Administrator',
      desc: 'Master data, tool overrides, replacements & full plant access',
      badge: 'Full Access',
      personaName: 'Anil Vernekar',
      personaId: 'EMP-ADMIN'
    }
  ];

  const roleConfig = ROLE_PERMISSIONS[activeRole];

  // Format clean user display name (strip parentheses like "(Setter)" if present)
  const cleanName = currentUser.name.replace(/\s*\(.*?\)/, '');
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'OP';

  // Plant shift schedule breakdown
  const plantShifts = [
    {
      code: 'S1',
      name: 'Shift 1 (Morning)',
      timing: '06:00 – 14:00',
      status: 'Active',
      isCurrent: true,
      supervisor: 'Dilip Shenvi',
      icon: <Sunrise className="w-3.5 h-3.5 text-amber-500" />,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      code: 'S2',
      name: 'Shift 2 (Afternoon)',
      timing: '14:00 – 22:00',
      status: 'Upcoming',
      isCurrent: false,
      supervisor: 'Mangesh Prabhu',
      icon: <Sun className="w-3.5 h-3.5 text-orange-500" />,
      color: 'text-slate-600 bg-slate-50 border-slate-200'
    },
    {
      code: 'S3',
      name: 'Shift 3 (Night)',
      timing: '22:00 – 06:00',
      status: 'Scheduled',
      isCurrent: false,
      supervisor: 'Vikas Naik',
      icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
      color: 'text-slate-600 bg-slate-50 border-slate-200'
    }
  ];

  return (
    <header className="bg-white border-b border-slate-200/90 px-5 py-2.5 sticky top-0 z-30 flex items-center justify-between gap-4 select-none shadow-xs">
      {/* Zone 1: Sidebar Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sidebar Collapse/Expand Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200/70 hover:border-slate-300 shadow-2xs cursor-pointer"
          title={isSidebarCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar Menu"}
          aria-label="Toggle Side Navigation"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4.5 h-4.5 text-slate-700" />
          ) : (
            <PanelLeftClose className="w-4.5 h-4.5 text-slate-700" />
          )}
        </button>
      </div>

      {/* Zone 2: Sophisticated Shift Telemetry & Operational Health */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Sophisticated Shift Details Capsule with Interactive Schedule Dropdown */}
        <div className="relative" ref={shiftDropdownRef}>
          <button
            onClick={() => setIsShiftDropdownOpen(!isShiftDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100/90 hover:from-white hover:to-slate-100 border border-slate-200/90 hover:border-slate-300 text-left transition-all shadow-2xs cursor-pointer group"
            title="Click to view full plant shift schedule and timetable"
            aria-expanded={isShiftDropdownOpen}
            aria-haspopup="true"
          >
            {/* Live pulsing radar dot & Shift Code */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white tracking-wider shadow-2xs">
                S1
              </span>
            </div>

            {/* Shift Title & Sub-Telemetry */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Shift 1 (Morning)
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded leading-tight">
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-slate-500 leading-none">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  06:00 – 14:00
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  21 Oct 2026
                </span>
              </div>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${
              isShiftDropdownOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'
            }`} />
          </button>

          {/* Sophisticated Shift Details Modal / Popover */}
          {isShiftDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200/90 py-3 px-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200/60">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Plant Shift Timetable</div>
                    <div className="text-[10px] text-slate-500 font-mono">Goa Plant • 3-Shift Roster</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  IST (UTC+5:30)
                </span>
              </div>

              {/* Shift Roster List */}
              <div className="mt-2.5 space-y-2">
                {plantShifts.map(s => (
                  <div 
                    key={s.code}
                    className={`p-2.5 rounded-lg border transition-all ${
                      s.isCurrent 
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs ring-1 ring-emerald-400/30' 
                        : 'bg-slate-50/70 border-slate-200/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {s.icon}
                        <span className="text-xs font-bold text-slate-900">{s.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        s.isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {s.timing}
                      </span>
                      <span>Sup: {s.supervisor}</span>
                    </div>

                    {s.isCurrent && (
                      <div className="mt-2 pt-1.5 border-t border-emerald-200/70 text-[10px] text-emerald-800 flex items-center justify-between font-sans">
                        <span className="font-medium">Active Window: Morning Run</span>
                        <span className="font-mono font-bold text-emerald-700">Ends 14:00</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Production Day Information */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Cycle: Monday – Saturday
                </span>
                <span className="font-mono font-medium text-slate-700">Bay 1 – Bay 4</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone 3: Demo Roles Dropdown & User Persona Capsule */}
      <div className="flex items-center gap-3 shrink-0">
        {/* "Demo Roles" Dropdown Selection */}
        <div className="relative" ref={roleDropdownRef}>
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all shadow-2xs cursor-pointer group"
            aria-expanded={isRoleDropdownOpen}
            aria-haspopup="true"
            title="Switch Demo Role persona to test permissions"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">Demo Roles</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 shadow-2xs">
              {roleConfig.label}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isRoleDropdownOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'
            }`} />
          </button>

          {/* Demo Roles Dropdown Menu */}
          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Demo Roles Switcher
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-mono font-semibold px-2 py-0.5 rounded-full border border-blue-200/60">
                    RBAC Simulation
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Simulate different plant staff permissions, navigation duties & edit controls.
                </p>
              </div>

              <div className="px-1.5 space-y-1">
                {roles.map(r => {
                  const isSelected = activeRole === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveRole(r.id);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-start justify-between cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50/90 text-blue-900 border border-blue-200/90 shadow-2xs'
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 p-1 rounded ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold leading-tight">{r.title}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                              isSelected 
                                ? 'bg-blue-200/70 text-blue-800' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {r.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {r.desc}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 px-3.5 py-1 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/80 rounded-b-lg">
                <span>Active Persona: <strong className="text-slate-800">{cleanName}</strong></span>
                <span className="font-mono text-slate-400">{currentUser.employeeId}</span>
              </div>
            </div>
          )}
        </div>

        {/* User Persona Profile Capsule */}
        <div className="hidden md:flex items-center gap-2.5 pl-2.5 border-l border-slate-200 text-right">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#0A192F] text-white font-bold text-xs flex items-center justify-center tracking-tight shadow-2xs border border-slate-700">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {cleanName}
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <span>{currentUser.employeeId}</span>
              <span className="text-slate-300">·</span>
              <span className="text-blue-700 font-semibold">{roleConfig.label}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
