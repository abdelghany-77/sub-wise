import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  PieChart,
  Target,
  BarChart3,
  Settings,
  Database,
  Plus,
  Eye,
  EyeOff,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { formatCurrency, formatDate } from "../../lib/utils";
import type { Page } from "../layout/Sidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onOpenAddModal: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddModal,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    transactions,
    accounts,
    privacyMode,
    togglePrivacyMode,
    getAccountById,
  } = useStore();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown handler for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Quick navigation items
  const navItems: CommandItem[] = useMemo(
    () => [
      { id: "nav-dash", title: "Go to Dashboard", subtitle: "Overview of wealth & metrics", icon: <LayoutDashboard size={16} />, action: () => onNavigate("dashboard"), category: "Navigation" },
      { id: "nav-acc", title: "Go to Accounts", subtitle: `View ${accounts.length} linked accounts`, icon: <CreditCard size={16} />, action: () => onNavigate("accounts"), category: "Navigation" },
      { id: "nav-tx", title: "Go to Transactions", subtitle: `View ${transactions.length} transaction records`, icon: <ArrowLeftRight size={16} />, action: () => onNavigate("transactions"), category: "Navigation" },
      { id: "nav-bud", title: "Go to Budgets", subtitle: "Monthly spending limits", icon: <PieChart size={16} />, action: () => onNavigate("budgets"), category: "Navigation" },
      { id: "nav-goal", title: "Go to Savings Goals", subtitle: "Track progress towards targets", icon: <Target size={16} />, action: () => onNavigate("goals"), category: "Navigation" },
      { id: "nav-rep", title: "Go to Reports", subtitle: "Income vs expense analysis", icon: <BarChart3 size={16} />, action: () => onNavigate("reports"), category: "Navigation" },
      { id: "nav-set", title: "Go to Settings", subtitle: "Preferences & currency configuration", icon: <Settings size={16} />, action: () => onNavigate("settings"), category: "Navigation" },
      { id: "nav-data", title: "Go to Data & Backup", subtitle: "Export / import JSON backups", icon: <Database size={16} />, action: () => onNavigate("data"), category: "Navigation" },
    ],
    [onNavigate, accounts.length, transactions.length],
  );

  // Quick actions
  const quickActions: CommandItem[] = useMemo(
    () => [
      {
        id: "act-add",
        title: "Add New Transaction",
        subtitle: "Create an income, expense, or transfer",
        icon: <Plus size={16} className="text-blue-400" />,
        action: () => {
          onClose();
          onOpenAddModal();
        },
        category: "Actions",
      },
      {
        id: "act-privacy",
        title: privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode",
        subtitle: privacyMode ? "Show real balances and amounts" : "Blur all financial numbers across the app",
        icon: privacyMode ? <Eye size={16} className="text-blue-400" /> : <EyeOff size={16} className="text-blue-400" />,
        action: () => {
          togglePrivacyMode();
          onClose();
        },
        category: "Actions",
      },
    ],
    [privacyMode, togglePrivacyMode, onClose, onOpenAddModal],
  );

  // Search transactions matching query
  const matchedTransactions: CommandItem[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return transactions
      .filter((tx) => {
        const acc = getAccountById(tx.accountId);
        return (
          tx.note.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          acc?.name.toLowerCase().includes(q) ||
          String(tx.amount).includes(q)
        );
      })
      .slice(0, 5)
      .map((tx) => {
        const acc = getAccountById(tx.accountId);
        return {
          id: `tx-${tx.id}`,
          title: tx.note || tx.category,
          subtitle: `${acc?.name} · ${formatDate(tx.date)} · ${formatCurrency(tx.amount, acc?.currency)}`,
          icon:
            tx.type === "income" ? (
              <ArrowDownLeft size={16} className="text-emerald-400" />
            ) : tx.type === "expense" ? (
              <ArrowUpRight size={16} className="text-rose-400" />
            ) : (
              <ArrowLeftRight size={16} className="text-sky-400" />
            ),
          action: () => {
            onNavigate("transactions");
            onClose();
          },
          category: "Transactions",
        };
      });
  }, [query, transactions, getAccountById, onNavigate, onClose]);

  // Combined searchable items
  const filteredItems: CommandItem[] = useMemo(() => {
    if (!query.trim()) {
      return [...quickActions, ...navItems];
    }
    const q = query.toLowerCase();
    const actions = quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q)),
    );
    const navs = navItems.filter(
      (n) => n.title.toLowerCase().includes(q) || (n.subtitle && n.subtitle.toLowerCase().includes(q)),
    );
    return [...matchedTransactions, ...actions, ...navs];
  }, [query, quickActions, navItems, matchedTransactions]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-[#111827] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-up flex flex-col max-h-[85vh]">
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search size={18} className="text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
            placeholder="Type a command or search transactions, accounts, actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            >
              <X size={14} />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[60vh]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-sm">
              <Coins size={28} className="mx-auto mb-2 opacity-30" />
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  data-index={index}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-blue-500/20 text-white border border-blue-500/30"
                      : "text-white/70 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-blue-500/30 text-white" : "bg-white/[0.05] text-white/60"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-white/40 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.03] flex-shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/70">↑</kbd>
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/70">↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/70">↵</kbd> to select
            </span>
          </div>
          <span className="text-blue-400 font-medium">Walleteer Command</span>
        </div>
      </div>
    </div>
  );
}
