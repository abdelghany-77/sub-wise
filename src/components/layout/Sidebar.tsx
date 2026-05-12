import { useMemo } from "react";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Database,
  Coins,
  PieChart,
  Target,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";

export type Page =
  | "dashboard"
  | "accounts"
  | "transactions"
  | "budgets"
  | "goals"
  | "reports"
  | "settings"
  | "data";

interface Props {
  current: Page;
  onChange: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { page: "accounts", label: "Accounts", icon: <CreditCard size={20} /> },
  { page: "transactions", label: "Transactions", icon: <ArrowLeftRight size={20} /> },
  { page: "budgets", label: "Budgets", icon: <PieChart size={20} /> },
  { page: "goals", label: "Goals", icon: <Target size={20} /> },
  { page: "reports", label: "Reports", icon: <BarChart3 size={20} /> },
  { page: "settings", label: "Settings", icon: <Settings size={20} /> },
  { page: "data", label: "Data & Backup", icon: <Database size={20} /> },
];

// Show top 6 on mobile bottom nav to avoid overcrowding
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) => !["data", "settings"].includes(i.page));

export function Sidebar({ current, onChange }: Props) {
  const { budgets, transactions } = useStore();

  // Count over-budget categories for badge
  const overBudgetCount = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const spending: Record<string, number> = {};
    transactions
      .filter((tx) => tx.type === "expense" && tx.date.startsWith(prefix))
      .forEach((tx) => {
        spending[tx.category] = (spending[tx.category] ?? 0) + tx.amount;
      });
    return budgets.filter((b) => (spending[b.category] ?? 0) > b.limit).length;
  }, [budgets, transactions]);

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-[#0d0d14] border-r border-white/[0.06] lg:static lg:z-auto">
        {/* Logo */}
        <div className="flex items-center px-6 h-16 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-glow">
              <Coins size={22} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">SubWise</span>
              <span className="block text-[10px] text-blue-400/70 font-medium tracking-wider uppercase leading-tight">
                Wealth Tracker
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ page, label, icon }) => (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={cn(
                "nav-link w-full text-left relative",
                current === page && "active",
              )}
            >
              {icon}
              {label}
              {page === "budgets" && overBudgetCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {overBudgetCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-white/25 text-center">
            All data stored locally · v0.1.1
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-[#0d0d14]/95 backdrop-blur-md border-t border-white/[0.06] flex items-stretch mobile-bottom-nav">
        {MOBILE_NAV_ITEMS.map(({ page, label, icon }) => (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-all duration-200 relative",
              current === page
                ? "text-blue-400"
                : "text-white/40 hover:text-white/70",
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200 relative",
                current === page ? "bg-blue-500/20" : "",
              )}
            >
              {icon}
              {page === "budgets" && overBudgetCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {overBudgetCount}
                </span>
              )}
            </span>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
