import { useState, useEffect } from "react";
import { Sidebar, type Page } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastContainer } from "./components/ui/Toast";
import { useStore } from "./store/useStore";
import "./index.css";

const VALID_PAGES: Page[] = ["dashboard", "accounts", "transactions", "budgets", "goals", "reports", "settings", "data"];

function AppContent() {
  const processRecurring = useStore((s) => s.processRecurringTransactions);

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

  return (
    <div className="flex h-[100dvh] bg-[#0d0d14] overflow-hidden">
      <Sidebar current={page} onChange={setPage} />
      <MainContent page={page} onChangePage={setPage} />
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
