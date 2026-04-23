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
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { useSystemState } from './hooks/useSystemState';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ShieldAlert } from 'lucide-react';

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
          case 'profile':
            return <Profile />;
          default:
            return <Dashboard state={state} />;
        }
      }}
    </MainLayout>
  );
}

function AppRoot() {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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
