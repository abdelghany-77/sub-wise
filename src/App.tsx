import { useState, useEffect } from "react";
import { Sidebar, type Page } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastContainer } from "./components/ui/Toast";
import { AddTransactionModal } from "./components/transactions/AddTransactionModal";
import { useStore } from "./store/useStore";
import "./index.css";

const VALID_PAGES: Page[] = [
  "dashboard",
  "accounts",
  "transactions",
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
  const [showQuickAdd, setShowQuickAdd] = useState(false);

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

  // Process recurring transactions on app load
  useEffect(() => {
    processRecurring();
  }, [processRecurring]);

  // Global 'N' keyboard shortcut for Quick-Add Transaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea or contenteditable element
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
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
      />
      {showQuickAdd && (
        <AddTransactionModal
          autoOpen
          onClose={() => setShowQuickAdd(false)}
        />
      )}
      <ToastContainer />
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
