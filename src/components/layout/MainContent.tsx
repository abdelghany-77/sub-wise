import { useState, useEffect } from "react";
import {
  Coins,
  Eye,
  EyeOff,
  Plus,
  Search,
  Command,
  Lock,
  Languages,
} from "lucide-react";
import { DashboardBentoView } from "../dashboard/DashboardBentoView";
import { AccountsPanel } from "../accounts/AccountsPanel";
import { TransactionHistory } from "../transactions/TransactionHistory";
import { CommitmentsPanel } from "../commitments/CommitmentsPanel";
import { BudgetsPanel } from "../budgets/BudgetsPanel";
import { SavingsGoalsPanel } from "../goals/SavingsGoalsPanel";
import { ReportsPanel } from "../reports/ReportsPanel";
import { SettingsPanel } from "../settings/SettingsPanel";
import { CommandPalette } from "../ui/CommandPalette";
import type { Page } from "./Sidebar";
import { useStore } from "../../store/useStore";
import { useT } from "../../lib/i18n";

interface Props {
  page: Page;
  onChangePage: (page: Page) => void;
  onOpenQuickAdd: () => void;
  onLockApp?: () => void;
}

const PAGE_TITLE_KEYS: Record<Page, string> = {
  dashboard: "nav.dashboard",
  accounts: "nav.accounts",
  transactions: "nav.transactions",
  commitments: "nav.commitments",
  subscriptions: "nav.bills",
  ious: "nav.ious",
  budgets: "nav.budgets",
  goals: "nav.goals",
  reports: "nav.reports",
  settings: "nav.settings",
  data: "nav.settings",
};

export function MainContent({
  page,
  onChangePage,
  onOpenQuickAdd,
  onLockApp,
}: Props) {
  const { privacyMode, togglePrivacyMode, settings, updateSettings } =
    useStore();
  const { t, lang } = useT();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0">
      {/* Top Bar — compact on mobile to stay well within 15% sticky cap */}
      <header className="sticky top-0 z-20 bg-[#080B10]/90 backdrop-blur-xl border-b border-white/[0.08] px-3 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top)] h-[calc(3.25rem+env(safe-area-inset-top))] sm:h-16 sm:pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Coins size={16} className="text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-white truncate tracking-tight">
              {t(PAGE_TITLE_KEYS[page] || "nav.dashboard")}
            </h1>
          </div>
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Global Search / Command Bar Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="min-h-[40px] min-w-[40px] sm:min-w-0 flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white/60 hover:text-white transition-all text-xs"
            aria-label="Open search"
          >
            <Search size={15} className="text-white/50" />
            <span className="hidden md:inline text-white/50">
              {t("nav.search")}
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/60">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Quick-Add Button (Desktop top bar) */}
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all border border-blue-400/30 active:scale-95 whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{t("nav.addTransaction")}</span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() =>
              updateSettings({ language: lang === "ar" ? "en" : "ar" })
            }
            aria-label="Toggle language"
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            className="min-h-[40px] min-w-[40px] px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1 text-[11px] font-bold"
          >
            <Languages size={15} className="hidden xs:inline" />
            <span>{lang === "ar" ? "EN" : "ع"}</span>
          </button>

          {/* Quick Lock App Button (only shown if PIN is configured) */}
          {settings.pinHash && onLockApp && (
            <button
              type="button"
              onClick={onLockApp}
              aria-label={t("nav.lockApp")}
              title={t("nav.lockApp")}
              className="min-h-[40px] min-w-[40px] rounded-xl text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/15 transition-all flex items-center justify-center"
            >
              <Lock size={16} />
            </button>
          )}

          {/* Privacy Toggle */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            aria-label={
              privacyMode ? t("nav.showAmounts") : t("nav.hideAmounts")
            }
            aria-pressed={privacyMode ? "true" : "false"}
            title={privacyMode ? t("nav.showAmounts") : t("nav.hideAmounts")}
            className={`min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-all duration-200 ${
              privacyMode
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {privacyMode ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 pb-28 md:pb-8 animate-fade-in">
        {page === "dashboard" && (
          <DashboardBentoView onNavigate={onChangePage} />
        )}
        {page === "accounts" && <AccountsPanel />}
        {page === "transactions" && <TransactionHistory />}
        {page === "commitments" && <CommitmentsPanel />}
        {page === "subscriptions" && (
          <CommitmentsPanel initialTab="subscriptions" />
        )}
        {page === "ious" && <CommitmentsPanel initialTab="ious" />}
        {page === "budgets" && <BudgetsPanel />}
        {page === "goals" && <SavingsGoalsPanel />}
        {page === "reports" && <ReportsPanel />}
        {(page === "settings" || page === "data") && <SettingsPanel />}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={onChangePage}
        onOpenAddModal={onOpenQuickAdd}
        onLockApp={onLockApp}
      />
    </main>
  );
}
