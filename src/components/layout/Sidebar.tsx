import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Database,
  Coins,
  PieChart,
  Target,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type Page =
  | "dashboard"
  | "accounts"
  | "transactions"
  | "budgets"
  | "goals"
  | "data";

interface Props {
  current: Page;
  onChange: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { page: "accounts", label: "Accounts", icon: <CreditCard size={20} /> },
  {
    page: "transactions",
    label: "Transactions",
    icon: <ArrowLeftRight size={20} />,
  },
  { page: "budgets", label: "Budgets", icon: <PieChart size={20} /> },
  { page: "goals", label: "Goals", icon: <Target size={20} /> },
  { page: "data", label: "Data & Backup", icon: <Database size={20} /> },
];

export function Sidebar({ current, onChange }: Props) {
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
              <span className="text-white font-bold text-lg leading-none">
                SubWise
              </span>
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
                "nav-link w-full text-left",
                current === page && "active",
              )}
            >
              {icon}
              {label}
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
        {NAV_ITEMS.map(({ page, label, icon }) => (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-all duration-200",
              current === page
                ? "text-blue-400"
                : "text-white/40 hover:text-white/70",
            )}
          >
            <span
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                current === page ? "bg-blue-500/20" : "",
              )}
            >
              {icon}
            </span>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
