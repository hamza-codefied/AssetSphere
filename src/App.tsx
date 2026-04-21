import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Hardware } from './pages/Hardware';
import { Tools } from './pages/Tools';
import { Accounts } from './pages/Accounts';
import { Subscriptions } from './pages/Subscriptions';
import { Projects } from './pages/Projects';
import { Employees } from './pages/Employees';
import { Vault } from './pages/Vault';
import { Guide } from './pages/Guide';
import { Login } from './pages/Login';
import { useSystemState } from './hooks/useSystemState';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ShieldAlert } from 'lucide-react';

const SettingsPlaceholder = () => (
  <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
    <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
      <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold">System Settings</h1>
    <p className="text-muted-foreground max-w-xs">Global configurations, API keys, and security policies will be managed here.</p>
  </div>
);

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
      <ShieldAlert className="w-10 h-10 text-destructive" />
    </div>
    <h1 className="text-2xl font-bold">Access Denied</h1>
    <p className="text-muted-foreground max-w-xs">Your current role does not have permission to access this module. Contact your administrator.</p>
  </div>
);

function AuthenticatedApp() {
  const state = useSystemState();
  const { can } = useAuth();

  return (
    <MainLayout>
      {(activeTab) => {
        switch (activeTab) {
          case 'dashboard':
            return can('dashboard.view') ? <Dashboard state={state} /> : <AccessDenied />;
          case 'hardware':
            return can('hardware.view') ? <Hardware state={state} /> : <AccessDenied />;
          case 'tools':
            return can('tools.view') ? <Tools state={state} /> : <AccessDenied />;
          case 'accounts':
            return can('accounts.view') ? <Accounts state={state} /> : <AccessDenied />;
          case 'subscriptions':
            return can('subscriptions.view') ? <Subscriptions state={state} /> : <AccessDenied />;
          case 'projects':
            return can('projects.view') ? <Projects state={state} /> : <AccessDenied />;
          case 'employees':
            return can('employees.view') ? <Employees state={state} /> : <AccessDenied />;
          case 'vault':
            return can('vault.view') ? <Vault state={state} /> : <AccessDenied />;
          case 'guide':
            return can('guide.view') ? <Guide /> : <AccessDenied />;
          case 'settings':
            return can('settings.view') ? <SettingsPlaceholder /> : <AccessDenied />;
          default:
            return <Dashboard state={state} />;
        }
      }}
    </MainLayout>
  );
}

function AppRoot() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}

export default App;
