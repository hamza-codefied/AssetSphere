import { Badge, Card } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { getPermissions, roleConfig } from '../auth/permissions';
import { ShieldCheck, UserCircle2, Mail, KeyRound } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  const roleMeta = roleConfig[user.role];
  const permissions = getPermissions(user.role);
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Your account identity and role permissions.</p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info">{roleMeta.label}</Badge>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${roleMeta.color}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-accent/30 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User ID</p>
            <p className="text-sm font-mono break-all">{user.id}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserCircle2 className="w-3.5 h-3.5" />
              Identity from authenticated session
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-accent/30 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
            <p className="text-sm font-medium break-all">{user.email}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              Primary login email
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Role Description</h3>
        </div>
        <p className="text-sm text-muted-foreground">{roleMeta.description}</p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Your Permissions</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <Badge key={permission} variant="default" className="text-[11px]">
              {permission}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
};
