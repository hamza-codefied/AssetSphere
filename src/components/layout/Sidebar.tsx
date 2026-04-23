import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import type { Permission } from '../../auth/permissions';
import {
  LayoutDashboard,
  Monitor,
  ExternalLink,
  Users,
  Key,
  LogOut,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  CreditCard,
  FolderOpen,
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
    <Icon className="w-5 h-5 shrink-0" />
    {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
    {!collapsed && isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-70" />}
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
  onLogoutClick?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ activeTab, setActiveTab, collapsed, onLogoutClick, mobileOpen, onMobileClose }: SidebarProps) => {
  const { can } = useAuth();

  const allMenuItems: { id: string; label: string; icon: React.ElementType; permission: Permission }[] = [
    { id: 'dashboard',     label: 'Dashboard',       icon: LayoutDashboard, permission: 'dashboard.view' },
    { id: 'hardware',      label: 'Hardware',         icon: Monitor,         permission: 'hardware.view' },
    { id: 'tools',         label: 'Tools & Platforms', icon: ExternalLink,   permission: 'tools.view' },
    { id: 'accounts',      label: 'Central Accounts', icon: ShieldCheck,     permission: 'accounts.view' },
    { id: 'subscriptions', label: 'Subscriptions',    icon: CreditCard,      permission: 'subscriptions.view' },
    { id: 'projects',      label: 'Projects',         icon: FolderOpen,      permission: 'projects.view' },
    { id: 'employees',     label: 'Employees',        icon: Users,           permission: 'employees.view' },
    { id: 'vault',         label: 'Credential Vault', icon: Key,             permission: 'vault.view' },
    { id: 'guide',         label: 'User Guide',       icon: BookOpen,        permission: 'guide.view' },
  ];

  const menuItems = allMenuItems.filter(item => can(item.permission));

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto bg-card border-r flex flex-col transition-all duration-300 ease-in-out",
      collapsed ? "lg:w-20" : "lg:w-64",
      mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <Key className="w-5 h-5" />
        </div>
        <span className={cn(
          "font-bold text-xl tracking-tight transition-opacity duration-300",
          collapsed && "lg:opacity-0"
        )}>AssetSphere</span>
      </div>

      <div className="flex-1 px-3 space-y-1 py-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => {
              setActiveTab(item.id);
              onMobileClose?.();
            }}
            collapsed={collapsed}
          />
        ))}
      </div>

      <div className="p-4 border-t space-y-1">
        <SidebarItem
          icon={LogOut}
          label="Logout"
          onClick={() => {
            onLogoutClick?.();
            onMobileClose?.();
          }}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
};
