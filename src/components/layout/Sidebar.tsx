import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  CalendarClock,
  Settings,
  Coins,
  Plus,
  PieChart,
  Target,
  BarChart3,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn, todayISO, addDaysISO } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { registerBackHandler } from "../../lib/backButtonManager";
import { useT } from "../../lib/i18n";

export type Page =
  | "dashboard"
  | "accounts"
  | "transactions"
  | "commitments"
  | "subscriptions"
  | "ious"
  | "budgets"
  | "goals"
  | "reports"
  | "settings"
  | "data";

interface Props {
  current: Page;
  onChange: (page: Page) => void;
  onOpenQuickAdd: () => void;
}

interface NavItem {
  page: Page;
  activeMatch: Page[];
  labelKey: string;
  group: string;
  icon: React.ReactNode;
}

const PRIMARY_NAV: NavItem[] = [
  {
    page: "dashboard",
    activeMatch: ["dashboard"],
    labelKey: "nav.dashboard",
    group: "Overview",
    icon: <LayoutDashboard size={18} />,
  },
  {
    page: "accounts",
    activeMatch: ["accounts"],
    labelKey: "nav.accounts",
    group: "Overview",
    icon: <CreditCard size={18} />,
  },
  {
    page: "transactions",
    activeMatch: ["transactions"],
    labelKey: "nav.transactions",
    group: "Overview",
    icon: <ArrowLeftRight size={18} />,
  },
  {
    page: "commitments",
    activeMatch: ["commitments", "subscriptions", "ious"],
    labelKey: "nav.commitments",
    group: "Plan",
    icon: <CalendarClock size={18} />,
  },
  {
    page: "budgets",
    activeMatch: ["budgets"],
    labelKey: "nav.budgets",
    group: "Plan",
    icon: <PieChart size={18} />,
  },
  {
    page: "goals",
    activeMatch: ["goals"],
    labelKey: "nav.goals",
    group: "Plan",
    icon: <Target size={18} />,
  },
  {
    page: "reports",
    activeMatch: ["reports"],
    labelKey: "nav.reports",
    group: "Plan",
    icon: <BarChart3 size={18} />,
  },
  {
    page: "settings",
    activeMatch: ["settings", "data"],
    labelKey: "nav.settings",
    group: "System",
    icon: <Settings size={18} />,
  },
];

const MORE_NAV = PRIMARY_NAV.filter((n) =>
  ["commitments", "budgets", "goals", "reports", "settings"].includes(n.page),
);

export function Sidebar({ current, onChange, onOpenQuickAdd }: Props) {
  const { isBackupNeeded, recurring, ious, installments } = useStore();
  const { t, lang } = useT();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the "More" sheet whenever the page changes
  useEffect(() => {
    setMoreOpen(false);
  }, [current]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const unregisterBack = registerBackHandler(() => {
      setMoreOpen(false);
      return true;
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      unregisterBack();
    };
  }, [moreOpen]);

  // Upcoming bills & installments due within 7 days (local date safe)
  const upcomingBillsCount = useMemo(() => {
    const today = todayISO();
    const in7Days = addDaysISO(7);
    const billsDue = recurring.filter(
      (r) =>
        r.type === "expense" &&
        r.status !== "paused" &&
        r.nextDueDate >= today &&
        r.nextDueDate <= in7Days,
    ).length;
    const installmentsDue = (installments ?? []).filter(
      (inst) =>
        inst.status === "active" &&
        inst.nextDueDate >= today &&
        inst.nextDueDate <= in7Days,
    ).length;
    return billsDue + installmentsDue;
  }, [recurring, installments]);

  const pendingIousCount = useMemo(
    () => ious.filter((i) => i.status === "pending").length,
    [ious],
  );

  const totalCommitmentAlerts = upcomingBillsCount + pendingIousCount;
  const backupNeeded = isBackupNeeded();
  const moreActive = MORE_NAV.some((n) => n.activeMatch.includes(current));

  const mobileTab = (
    page: Page,
    label: string,
    icon: React.ReactNode,
    activeMatch: Page[] = [page],
    badge?: React.ReactNode,
  ) => {
    const isActive = activeMatch.includes(current);
    return (
      <button
        type="button"
        onClick={() => onChange(page)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center flex-1 min-h-[46px] min-w-0 py-0.5 transition-all duration-200 group relative",
          isActive
            ? "text-blue-400"
            : "text-white/45 hover:text-white/75 active:scale-95",
        )}
      >
        <div className="relative flex items-center justify-center">
          <span
            className={cn(
              "p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center",
              isActive
                ? "bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/20"
                : "text-white/45 group-hover:text-white/75",
            )}
          >
            {icon}
          </span>
          {badge}
        </div>
        <span
          className={cn(
            "text-[10px] mt-0.5 tracking-tight truncate max-w-full px-0.5 transition-colors duration-200",
            isActive ? "font-semibold text-blue-400" : "font-medium text-white/45",
          )}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (md: and up) */}
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col bg-[#080B11] border-e border-white/[0.08] flex-shrink-0 z-30 select-none">
        <div className="flex items-center px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Coins size={22} className="text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-lg tracking-tight">
                  Walleteer
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  CFO
                </span>
              </div>
              <span className="block text-[10px] text-white/40 font-medium tracking-wider uppercase">
                Personal Wealth OS
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all duration-200 border border-blue-400/25"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t("nav.addTransaction")}</span>
            <kbd className="ms-auto text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded border border-white/10 text-white/70">
              N
            </kbd>
          </button>
        </div>

        <nav
          className="flex-1 px-3 py-1 overflow-y-auto"
          aria-label="Main navigation"
        >
          {PRIMARY_NAV.map(({ page, activeMatch, labelKey, icon, group }, i) => {
            const isActive = activeMatch.includes(current);
            const showGroup = i === 0 || PRIMARY_NAV[i - 1].group !== group;
            const groupLabel =
              lang === "ar"
                ? group === "Overview"
                  ? "نظرة عامة"
                  : group === "Plan"
                    ? "التخطيط"
                    : "النظام"
                : group;

            return (
              <div key={page}>
                {showGroup && (
                  <p className="px-3.5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                    {groupLabel}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onChange(page)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200 group relative border border-transparent",
                    isActive &&
                      "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white border-blue-500/30 shadow-sm shadow-blue-500/10 font-semibold",
                  )}
                >
                  <span
                    className={cn(
                      "text-white/50 group-hover:text-blue-400 transition-colors",
                      isActive && "text-blue-400",
                    )}
                  >
                    {icon}
                  </span>
                  <span className="tracking-wide truncate">{t(labelKey)}</span>

                  {page === "commitments" && totalCommitmentAlerts > 0 && (
                    <span className="ms-auto bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center tabular-nums">
                      {totalCommitmentAlerts}
                    </span>
                  )}

                  {page === "settings" && backupNeeded && (
                    <span
                      title="Backup recommended"
                      className="ms-auto w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20"
                    />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="px-5 py-3 border-t border-white/[0.06] text-[10px] text-white/30 flex items-center justify-between">
          <span>{t("nav.search")}</span>
          <kbd className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10 text-white/50">
            Ctrl K
          </kbd>
        </div>
      </aside>

      {/* "More" bottom sheet (mobile) */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMoreOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fade-in pointer-events-none" />
          <div
            role="dialog"
            aria-label="More pages"
            className="relative w-full max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-[#0F1521] border-t border-white/[0.1] px-4 pt-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] animate-slide-up shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-1 rounded-full bg-white/15 absolute left-1/2 -translate-x-1/2 top-2" />
              <h2 className="text-sm font-semibold text-white mt-2">
                {t("nav.more")}
              </h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center mt-1 rounded-xl text-white/50 hover:text-white bg-white/[0.06]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
              {MORE_NAV.map(({ page, labelKey, icon, activeMatch }) => {
                const isActive = activeMatch.includes(current);
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onChange(page)}
                    className={cn(
                      "flex items-center gap-3 p-3.5 min-h-[52px] rounded-2xl border text-start text-xs font-semibold transition-colors relative active:scale-[0.98]",
                      isActive
                        ? "bg-blue-500/15 border-blue-500/30 text-white"
                        : "bg-white/[0.04] border-white/[0.07] text-white/75 hover:bg-white/[0.08]",
                    )}
                  >
                    <span
                      className={cn(
                        "text-white/50 flex-shrink-0",
                        isActive && "text-blue-400",
                      )}
                    >
                      {icon}
                    </span>
                    <span className="truncate">{t(labelKey)}</span>
                    {page === "commitments" && totalCommitmentAlerts > 0 && (
                      <span className="ms-auto bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                        {totalCommitmentAlerts}
                      </span>
                    )}
                    {page === "settings" && backupNeeded && (
                      <span className="ms-auto w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0F1521]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (< md) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-[60] bg-[#080B11]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-1.5">
          {mobileTab("dashboard", t("nav.home"), <LayoutDashboard size={20} />)}
          {mobileTab("accounts", t("nav.accounts"), <CreditCard size={20} />)}

          {/* Centered Quick Add Action Button */}
          <div className="flex items-center justify-center flex-1">
            <button
              type="button"
              onClick={onOpenQuickAdd}
              aria-label={t("nav.addTransaction")}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 text-white shadow-lg shadow-blue-500/35 border border-white/20 flex items-center justify-center active:scale-90 hover:brightness-110 transition-all duration-200 -translate-y-0.5"
            >
              <Plus size={22} strokeWidth={2.5} className="drop-shadow" />
            </button>
          </div>

          {mobileTab(
            "transactions",
            t("nav.activity"),
            <ArrowLeftRight size={20} />,
          )}

          {/* More Tab */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[46px] min-w-0 py-0.5 transition-all duration-200 group relative",
              moreActive || moreOpen
                ? "text-blue-400"
                : "text-white/45 hover:text-white/75 active:scale-95",
            )}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center",
                  moreActive || moreOpen
                    ? "bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/20"
                    : "text-white/45 group-hover:text-white/75",
                )}
              >
                <MoreHorizontal size={20} />
              </span>
              {totalCommitmentAlerts > 0 ? (
                <span className="absolute -top-1 -end-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center ring-2 ring-[#080B11] shadow-sm tabular-nums">
                  {totalCommitmentAlerts}
                </span>
              ) : backupNeeded ? (
                <span className="absolute top-0 end-0 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#080B11]" />
              ) : null}
            </div>
            <span
              className={cn(
                "text-[10px] mt-0.5 tracking-tight truncate max-w-full px-0.5 transition-colors duration-200",
                moreActive || moreOpen
                  ? "font-semibold text-blue-400"
                  : "font-medium text-white/45",
              )}
            >
              {t("nav.more")}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
