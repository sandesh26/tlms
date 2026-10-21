import React from 'react';
import { AppProvider, useApp, isViewAllowed, ROLE_PERMISSIONS, VIEW_TITLES } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToolDetailDrawer } from './components/common/ToolDetailDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';

// Views
import { DashboardView } from './components/views/DashboardView';
import { ToolMasterListView } from './components/views/ToolMasterListView';
import { ToolRegistrationView } from './components/views/ToolRegistrationView';
import { ShiftConsumptionView } from './components/views/ShiftConsumptionView';
import { MissedConsumptionView } from './components/views/MissedConsumptionView';
import { AdminToolManagementView } from './components/views/AdminToolManagementView';
import { MasterDataAdminView } from './components/views/MasterDataAdminView';
import { ReportsExportView } from './components/views/ReportsExportView';
import { ActivityLogsView } from './components/views/ActivityLogsView';

const AccessRestrictedCard: React.FC = () => {
  const { currentView, activeRole, setActiveRole, setCurrentView } = useApp();
  const roleConfig = ROLE_PERMISSIONS[activeRole];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-xl mx-auto my-12 text-center space-y-4 shadow-xs">
      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">Module Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested module <strong className="text-slate-800">"{VIEW_TITLES[currentView] || currentView}"</strong> is
          outside the duty scope of the <span className="font-semibold text-slate-900">{roleConfig.label}</span> role.
        </p>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 text-left">
        <div className="font-semibold text-slate-800 mb-1">Permitted Duties for {roleConfig.label}:</div>
        <p className="text-slate-600">{roleConfig.duties}</p>
        <div className="mt-2 text-slate-500 font-mono text-[11px]">
          Authorized Modules: {roleConfig.allowedViews.map(v => VIEW_TITLES[v]).join(', ')}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => setCurrentView(roleConfig.defaultView)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Go to Authorized Screen ({VIEW_TITLES[roleConfig.defaultView]})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setActiveRole('admin')}
          className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
          <span>Switch to Admin for Full View</span>
        </button>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { currentView, activeRole } = useApp();

  const isAllowed = isViewAllowed(activeRole, currentView);

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {!isAllowed ? (
          <AccessRestrictedCard />
        ) : (
          <>
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'tool-master' && <ToolMasterListView />}
            {currentView === 'tool-registration' && <ToolRegistrationView />}
            {currentView === 'shift-consumption' && <ShiftConsumptionView />}
            {currentView === 'missed-consumption' && <MissedConsumptionView />}
            {currentView === 'admin-tool-management' && <AdminToolManagementView />}
            {currentView === 'master-data' && <MasterDataAdminView />}
            {currentView === 'reports-export' && <ReportsExportView />}
            {currentView === 'activity-logs' && <ActivityLogsView />}
          </>
        )}
      </main>
      <ToolDetailDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="flex min-h-screen w-full bg-slate-100 font-sans text-slate-800 antialiased">
        <Sidebar />
        <MainContent />
      </div>
    </AppProvider>
  );
}
