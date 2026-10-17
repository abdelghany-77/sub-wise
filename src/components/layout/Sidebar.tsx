import { useMemo } from "react";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  CalendarClock,
  Settings,
  Coins,
  Plus,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";

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

const PRIMARY_NAV: {
  page: Page;
  activeMatch: Page[];
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    page: "dashboard",
    activeMatch: ["dashboard"],
    label: "Dashboard",
    icon: <LayoutDashboard size={19} />,
  },
  {
    page: "accounts",
    activeMatch: ["accounts"],
    label: "Accounts & Vault",
    icon: <CreditCard size={19} />,
  },
  {
    page: "transactions",
    activeMatch: ["transactions"],
    label: "Transactions",
    icon: <ArrowLeftRight size={19} />,
  },
  {
    page: "commitments",
    activeMatch: ["commitments", "subscriptions", "ious"],
    label: "Bills & IOUs",
    icon: <CalendarClock size={19} />,
  },
  {
    page: "settings",
    activeMatch: ["settings", "data"],
    label: "Settings & Backup",
    icon: <Settings size={19} />,
  },
];

export function Sidebar({ current, onChange, onOpenQuickAdd }: Props) {
  const { isBackupNeeded, recurring, ious } = useStore();

  // Upcoming bills count in next 7 days
  const upcomingBillsCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const in7Days = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
    return recurring.filter(
      (r) =>
        r.type === "expense" &&
        r.status !== "paused" &&
        r.nextDueDate >= today &&
        r.nextDueDate <= in7Days,
    ).length;
  }, [recurring]);

  // Pending IOUs count
  const pendingIousCount = useMemo(() => {
    return ious.filter((i) => i.status === "pending").length;
  }, [ious]);

  const totalCommitmentAlerts = upcomingBillsCount + pendingIousCount;
  const backupNeeded = isBackupNeeded();

  return (
    <>
      {/* Desktop Sidebar (md: and up) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-[#080B11] border-r border-white/[0.08] flex-shrink-0 z-30 select-none">
        {/* Logo & Brand Header */}
        <div className="flex items-center px-6 h-16 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Coins size={22} className="text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-lg tracking-tight">Walleteer</span>
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

        {/* Quick-Add Transaction Action (Desktop) */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={onOpenQuickAdd}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all duration-200 border border-blue-400/25"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Quick Transaction</span>
            <kbd className="ml-auto text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded border border-white/10 text-white/70">
              N
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {PRIMARY_NAV.map(({ page, activeMatch, label, icon }) => {
            const isActive = activeMatch.includes(current);

            return (
              <button
                key={page}
                onClick={() => onChange(page)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200 group relative",
                  isActive &&
                    "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-white border border-blue-500/30 shadow-sm shadow-blue-500/10 font-semibold",
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
                <span className="tracking-wide">{label}</span>

                {/* Badges */}
                {page === "commitments" && totalCommitmentAlerts > 0 && (
                  <span className="ml-auto bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center">
                    {totalCommitmentAlerts}
                  </span>
                )}

                {page === "settings" && backupNeeded && (
                  <span
                    title="Backup recommended"
                    className="ml-auto w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="px-5 py-3.5 border-t border-white/[0.06] bg-[#07090E]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-white/40 font-mono">Offline-First PWA</span>
          </div>
          <span className="text-[10px] text-white/30 font-mono">v0.3.0</span>
        </div>
      </aside>

      {/* Mobile Glassmorphic Bottom Navigation Bar (< md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0F17]/90 backdrop-blur-xl border-t border-white/[0.08] pb-safe">
        <div className="relative flex items-center justify-around px-2 py-1.5">
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => onChange("dashboard")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-all duration-200",
              current === "dashboard" ? "text-blue-400 font-semibold" : "text-white/45 hover:text-white/70",
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-xl transition-all",
                current === "dashboard" ? "bg-blue-500/20" : "",
              )}
            >
              <LayoutDashboard size={20} />
            </span>
            <span>Dashboard</span>
          </button>

          {/* Tab 2: Accounts */}
          <button
            onClick={() => onChange("accounts")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-all duration-200",
              current === "accounts" ? "text-blue-400 font-semibold" : "text-white/45 hover:text-white/70",
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-xl transition-all",
                current === "accounts" ? "bg-blue-500/20" : "",
              )}
            >
              <CreditCard size={20} />
            </span>
            <span>Accounts</span>
          </button>

          {/* Center Elevated Quick-Add Action Button */}
          <div className="relative flex items-center justify-center flex-1">
            <button
              onClick={onOpenQuickAdd}
              aria-label="Add Transaction (N)"
              className="absolute -top-5 w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-500/40 ring-4 ring-[#0B0F17] flex items-center justify-center active:scale-90 transition-all duration-200 border border-white/20"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
            <span className="text-[10px] mt-6 font-semibold text-white/50">Add</span>
          </div>

          {/* Tab 3: Transactions */}
          <button
            onClick={() => onChange("transactions")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-all duration-200",
              current === "transactions" ? "text-blue-400 font-semibold" : "text-white/45 hover:text-white/70",
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-xl transition-all",
                current === "transactions" ? "bg-blue-500/20" : "",
              )}
            >
              <ArrowLeftRight size={20} />
            </span>
            <span>History</span>
          </button>

          {/* Tab 4: Commitments (Bills & IOUs) */}
          <button
            onClick={() => onChange("commitments")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-all duration-200 relative",
              ["commitments", "subscriptions", "ious"].includes(current)
                ? "text-blue-400 font-semibold"
                : "text-white/45 hover:text-white/70",
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-xl transition-all relative",
                ["commitments", "subscriptions", "ious"].includes(current) ? "bg-blue-500/20" : "",
              )}
            >
              <CalendarClock size={20} />
              {totalCommitmentAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#0B0F17]" />
              )}
            </span>
            <span>Bills & IOUs</span>
          </button>
        </div>
      </nav>
    </>
  );
}
