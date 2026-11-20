import { useState, useEffect } from "react";
import { Sidebar, type Page } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastContainer } from "./components/ui/Toast";
import { OfflineBanner } from "./components/ui/OfflineBanner";
import { AppLockScreen } from "./components/ui/AppLockScreen";
import { AddTransactionModal } from "./components/transactions/AddTransactionModal";
import { useStore } from "./store/useStore";
import { initCapacitorApp } from "./lib/capacitorInit";
import { NotificationService } from "./lib/NotificationService";
import { getAccountBalanceCurrency } from "./lib/utils";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import "./index.css";

const VALID_PAGES: Page[] = [
  "dashboard",
  "accounts",
  "transactions",
  "commitments",
  "subscriptions",
  "ious",
  "budgets",
  "goals",
  "reports",
  "settings",
  "data",
];

function AppContent() {
  const processRecurring = useStore((s) => s.processRecurringTransactions);
  const recurring = useStore((s) => s.recurring);
  const accounts = useStore((s) => s.accounts);
  const notificationsEnabled = useStore(
    (s) => s.settings.notificationsEnabled !== false,
  );
  const language = useStore((s) => s.settings.language ?? "en");
  const pinHash = useStore((s) => s.settings.pinHash);
  const autoLockOnResume = useStore((s) => s.settings.autoLockOnResume);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => Boolean(pinHash));

  // If user clears PIN while unlocked, ensure lock screen stays dismissed
  useEffect(() => {
    if (!pinHash) setIsLocked(false);
  }, [pinHash]);

  // Apply RTL/LTR direction and lang attribute to <html>
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Hash-based routing
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.slice(1) as Page;
    return VALID_PAGES.includes(hash) ? hash : "dashboard";
  });

  // Sync hash with page
  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  // Listen for browser back/forward
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1) as Page;
      if (VALID_PAGES.includes(hash)) setPage(hash);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Initialize native Capacitor bindings ONCE on mount (fixes back-button listener leak)
  useEffect(() => {
    initCapacitorApp();
    processRecurring();
  }, [processRecurring]);

  // Sync scheduled bill notifications whenever bills, accounts, or notification toggle changes
  useEffect(() => {
    const currencyByAccount: Record<string, string> = {};
    for (const acc of accounts) {
      currencyByAccount[acc.id] = getAccountBalanceCurrency(acc);
    }
    NotificationService.syncAllBillReminders(
      recurring,
      notificationsEnabled,
      currencyByAccount,
    ).catch(() => {});
  }, [recurring, accounts, notificationsEnabled]);

  // Re-sync & optional auto-lock on app resume (Capacitor + Web visibilitychange)
  useEffect(() => {
    const onResume = () => {
      const state = useStore.getState();
      state.processRecurringTransactions();
      const map: Record<string, string> = {};
      for (const acc of state.accounts) {
        map[acc.id] = getAccountBalanceCurrency(acc);
      }
      NotificationService.syncAllBillReminders(
        state.recurring,
        state.settings.notificationsEnabled !== false,
        map,
      ).catch(() => {});
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        const s = useStore.getState().settings;
        if (s.pinHash && s.autoLockOnResume) {
          setIsLocked(true);
        }
      } else if (document.visibilityState === "visible") {
        onResume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let capCleanup: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      const sub = CapApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          onResume();
        } else {
          const s = useStore.getState().settings;
          if (s.pinHash && s.autoLockOnResume) {
            setIsLocked(true);
          }
        }
      });
      capCleanup = () => {
        sub.then((h) => h.remove());
      };
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      capCleanup?.();
    };
  }, [autoLockOnResume]);

  // Global 'N' keyboard shortcut for Quick-Add Transaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT"
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowQuickAdd(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked]);

  // Prevent zoom gestures on mobile/Safari/desktop
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("gesturestart", handleGestureStart);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("gesturestart", handleGestureStart);
    };
  }, []);

  return (
    <div className="flex h-[100dvh] bg-[#0B0F17] overflow-hidden text-white font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      <Sidebar
        current={page}
        onChange={setPage}
        onOpenQuickAdd={() => setShowQuickAdd(true)}
      />
      <MainContent
        page={page}
        onChangePage={setPage}
        onOpenQuickAdd={() => setShowQuickAdd(true)}
        onLockApp={pinHash ? () => setIsLocked(true) : undefined}
      />
      {showQuickAdd && (
        <AddTransactionModal
          autoOpen
          onClose={() => setShowQuickAdd(false)}
        />
      )}
      {isLocked && pinHash && (
        <AppLockScreen
          expectedHash={pinHash}
          onUnlock={() => setIsLocked(false)}
        />
      )}
      <ToastContainer />
      <OfflineBanner />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
