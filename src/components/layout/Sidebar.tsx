import React from 'react';
import { 
  LayoutDashboard, 
  Monitor, 
  ExternalLink, 
  Users, 
  Key, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick, collapsed }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "sidebar-link w-full justify-start",
      isActive && "sidebar-link-active"
    )}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
    {!collapsed && isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-70" />}
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
}

export const Sidebar = ({ activeTab, setActiveTab, collapsed }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hardware', label: 'Hardware', icon: Monitor },
    { id: 'tools', label: 'Tools & Platforms', icon: ExternalLink },
    { id: 'accounts', label: 'Central Accounts', icon: ShieldCheck },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'vault', label: 'Credential Vault', icon: Key },
    { id: 'guide', label: 'User Guide', icon: BookOpen },
  ];



  return (
    <div className={cn(
      "h-screen bg-card border-r flex flex-col transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <Key className="w-5 h-5" />
        </div>
        {!collapsed && <span className="font-bold text-xl tracking-tight">AssetSphere</span>}
      </div>

      <div className="flex-1 px-3 space-y-1 py-4">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
            collapsed={collapsed}
          />
        ))}
      </div>

      <div className="p-4 border-t space-y-1">
        <SidebarItem
          icon={Settings}
          label="Settings"
          isActive={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={LogOut}
          label="Logout"
          onClick={() => console.log('Logout')}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
};
