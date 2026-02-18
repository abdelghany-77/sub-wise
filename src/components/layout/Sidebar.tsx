import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Database,
  Menu,
  X,
  Coins,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type Page = "dashboard" | "accounts" | "transactions" | "data";

interface Props {
  current: Page;
  onChange: (page: Page) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { page: "accounts", label: "Accounts", icon: <CreditCard size={18} /> },
  {
    page: "transactions",
    label: "Transactions",
    icon: <ArrowLeftRight size={18} />,
  },
  { page: "data", label: "Data & Backup", icon: <Database size={18} /> },
];

export function Sidebar({
  current,
  onChange,
  isMobileOpen,
  onMobileToggle,
}: Props) {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-[#0d0d14] border-r border-white/[0.06]",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-glow">
              <Coins size={17} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">
                SubWise
              </span>
              <span className="block text-[10px] text-violet-400/70 font-medium tracking-wider uppercase leading-tight">
                Wealth Tracker
              </span>
            </div>
          </div>
          <button
            onClick={onMobileToggle}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ page, label, icon }) => (
            <button
              key={page}
              onClick={() => {
                onChange(page);
                onMobileToggle();
              }}
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
            All data stored locally · v0.1.0
          </p>
        </div>
      </aside>

      {/* Mobile Header Toggle */}
      <button
        onClick={onMobileToggle}
        className="fixed top-4 left-4 z-20 lg:hidden p-2 rounded-xl bg-[#131320] border border-white/10 text-white/60 hover:text-white"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
