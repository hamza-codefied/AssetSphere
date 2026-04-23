import React, { useState, useCallback, useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { AnimatePresence, motion } from "framer-motion";
import { Modal, Button, PasswordInput } from "../ui";
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
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTabState] = useState(readStoredTab);
  const [sidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isVaultAuthModalOpen, setIsVaultAuthModalOpen] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");
  const [vaultAuthError, setVaultAuthError] = useState<string | null>(null);
  const [isVaultAuthPending, setIsVaultAuthPending] = useState(false);
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<string | null>(
    null,
  );
  const skipNextVaultGuardRef = useRef(false);

  const shouldPromptVaultPassword =
    user?.role === "admin" || user?.role === "pmo";

  const setActiveTab = useCallback((tab: string) => {
    if (tab === "vault" && shouldPromptVaultPassword) {
      setPendingTabAfterAuth("vault");
      setVaultPassword("");
      setVaultAuthError(null);
      setIsVaultAuthModalOpen(true);
      setIsMobileMenuOpen(false);
      return;
    }
    setActiveTabState(tab);
    persistTab(tab);
    setIsMobileMenuOpen(false);
  }, [shouldPromptVaultPassword]);

  useEffect(() => {
    if (!shouldPromptVaultPassword || activeTab !== "vault") return;
    if (skipNextVaultGuardRef.current) {
      skipNextVaultGuardRef.current = false;
      return;
    }
    setPendingTabAfterAuth("vault");
    setVaultPassword("");
    setVaultAuthError(null);
    setIsVaultAuthModalOpen(true);
    setActiveTabState("dashboard");
    persistTab("dashboard");
  }, [activeTab, shouldPromptVaultPassword]);

  const closeVaultAuthModal = () => {
    setIsVaultAuthModalOpen(false);
    setVaultPassword("");
    setVaultAuthError(null);
    setPendingTabAfterAuth(null);
  };

  const confirmVaultAccess = async () => {
    if (!user || !pendingTabAfterAuth) return;
    if (!vaultPassword.trim()) {
      setVaultAuthError("Please enter your login password.");
      return;
    }
    setVaultAuthError(null);
    setIsVaultAuthPending(true);
    const result = await login(user.email, vaultPassword);
    setIsVaultAuthPending(false);
    if (!result.success) {
      setVaultAuthError(result.error ?? "Password verification failed.");
      return;
    }
    skipNextVaultGuardRef.current = true;
    setActiveTabState(pendingTabAfterAuth);
    persistTab(pendingTabAfterAuth);
    closeVaultAuthModal();
  };

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

      <Modal
        isOpen={isVaultAuthModalOpen}
        onClose={closeVaultAuthModal}
        title="Confirm Vault Access"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Re-enter your login password to open Credential Vault.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Account Password
            </label>
            <PasswordInput
              value={vaultPassword}
              onChange={(e) => setVaultPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void confirmVaultAccess();
                }
              }}
            />
          </div>
          {vaultAuthError && (
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-600">
              {vaultAuthError}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={closeVaultAuthModal}
              disabled={isVaultAuthPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void confirmVaultAccess();
              }}
              disabled={isVaultAuthPending}
            >
              {isVaultAuthPending ? "Verifying..." : "Continue"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
