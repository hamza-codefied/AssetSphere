import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { roleConfig } from '../../auth/permissions';

interface NavbarProps {
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
}

export const Navbar = ({ onMenuClick, onProfileClick, onLogoutClick }: NavbarProps) => {
  const { user } = useAuth();

  const initials = user ? user.name.split(' ').map(n => n[0]).join('') : '??';
  const roleMeta = user ? roleConfig[user.role] : null;

  return (
    <nav className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-accent rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-3 p-1.5 hover:bg-accent rounded-xl transition-colors"
          onClick={onProfileClick}
          title="Open profile"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
            {initials}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold leading-none">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {roleMeta && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={onLogoutClick}
          className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-xl text-muted-foreground transition-colors ml-1"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
