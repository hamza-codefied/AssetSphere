import React, { useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { AnimatePresence, motion } from "framer-motion";
import { Modal, Button } from "../ui";
import { useAuth } from "../../auth/AuthContext";

interface MainLayoutProps {
  children: (activeTab: string) => React.ReactNode;
}

const TAB_STORAGE_KEY = "assetsphere-active-tab";

const VALID_TABS = new Set([
  "dashboard",
  "hardware",
  "tools",
  "accounts",
  "subscriptions",
  "projects",
  "employees",
  "vault",
  "guide",
  "profile",
]);

function readStoredTab(): string {
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (raw && VALID_TABS.has(raw)) return raw;
  } catch {
    /* private mode */
  }
  return "dashboard";
}

function persistTab(tab: string) {
  try {
    if (VALID_TABS.has(tab)) sessionStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    /* ignore */
  }
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { logout } = useAuth();
  const [activeTab, setActiveTabState] = useState(readStoredTab);
  const [sidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    persistTab(tab);
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        mobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onProfileClick={() => setActiveTab("profile")}
          onLogoutClick={() => setIsLogoutModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children(activeTab)}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to logout from AssetSphere?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setIsLogoutModalOpen(false);
                void logout();
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
