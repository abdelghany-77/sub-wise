import React, { useState, useEffect, useMemo, useRef } from "react";
import { registerBackHandler } from "../../lib/backButtonManager";
import {
  Search,
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  CalendarClock,
  PieChart,
  Target,
  BarChart3,
  Settings,
  Plus,
  Eye,
  EyeOff,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Languages,
  Lock,
  Layers,
  Users,
  X,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import {
  formatCurrency,
  formatDate,
  getAccountBalanceCurrency,
} from "../../lib/utils";
import type { Page } from "../layout/Sidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onOpenAddModal: () => void;
  onLockApp?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  amountText?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddModal,
  onLockApp,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    transactions,
    accounts,
    recurring,
    ious,
    installments,
    savingsGoals,
    privacyMode,
    togglePrivacyMode,
    settings,
    updateSettings,
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

  // Android hardware back button handler
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerBackHandler(() => {
      onClose();
      return true;
    });
    return unregister;
  }, [isOpen, onClose]);

  // Quick navigation items
  const navItems: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-dash",
        title: "Go to Dashboard",
        subtitle: "Overview of wealth & metrics",
        icon: <LayoutDashboard size={16} />,
        action: () => onNavigate("dashboard"),
        category: "Navigation",
      },
      {
        id: "nav-acc",
        title: "Go to Accounts & Vault",
        subtitle: `View ${accounts.length} linked accounts & vaults`,
        icon: <CreditCard size={16} />,
        action: () => onNavigate("accounts"),
        category: "Navigation",
      },
      {
        id: "nav-tx",
        title: "Go to Transactions",
        subtitle: `View ${transactions.length} ledger records`,
        icon: <ArrowLeftRight size={16} />,
        action: () => onNavigate("transactions"),
        category: "Navigation",
      },
      {
        id: "nav-comm",
        title: "Go to Bills, Installments & IOUs",
        subtitle: "Subscriptions, installments & lent/borrowed debts",
        icon: <CalendarClock size={16} />,
        action: () => onNavigate("commitments"),
        category: "Navigation",
      },
      {
        id: "nav-bud",
        title: "Go to Budgets",
        subtitle: "Monthly spending limits",
        icon: <PieChart size={16} />,
        action: () => onNavigate("budgets"),
        category: "Navigation",
      },
      {
        id: "nav-goal",
        title: "Go to Savings Goals",
        subtitle: "Track progress towards targets",
        icon: <Target size={16} />,
        action: () => onNavigate("goals"),
        category: "Navigation",
      },
      {
        id: "nav-rep",
        title: "Go to Reports",
        subtitle: "Income vs expense analysis",
        icon: <BarChart3 size={16} />,
        action: () => onNavigate("reports"),
        category: "Navigation",
      },
      {
        id: "nav-set",
        title: "Go to Settings & Backup",
        subtitle: "Budget target, PIN lock, language & backup",
        icon: <Settings size={16} />,
        action: () => onNavigate("settings"),
        category: "Navigation",
      },
    ],
    [onNavigate, accounts.length, transactions.length],
  );

  // Quick actions
  const quickActions: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
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
        subtitle: privacyMode
          ? "Show real balances and amounts"
          : "Blur all financial numbers across the app",
        icon: privacyMode ? (
          <Eye size={16} className="text-blue-400" />
        ) : (
          <EyeOff size={16} className="text-blue-400" />
        ),
        action: () => {
          togglePrivacyMode();
          onClose();
        },
        category: "Actions",
      },
      {
        id: "act-lang",
        title:
          settings.language === "ar"
            ? "Switch to English (LTR)"
            : "التبديل إلى العربية (RTL)",
        subtitle: "Change interface language and layout direction",
        icon: <Languages size={16} className="text-indigo-400" />,
        action: () => {
          updateSettings({
            language: settings.language === "ar" ? "en" : "ar",
          });
          onClose();
        },
        category: "Actions",
      },
    ];

    if (settings.pinHash && onLockApp) {
      items.push({
        id: "act-lock",
        title: "Lock App Now",
        subtitle: "Require PIN to access Walleteer",
        icon: <Lock size={16} className="text-amber-400" />,
        action: () => {
          onClose();
          onLockApp();
        },
        category: "Security",
      });
    }
    return items;
  }, [
    privacyMode,
    togglePrivacyMode,
    settings.language,
    settings.pinHash,
    updateSettings,
    onClose,
    onOpenAddModal,
    onLockApp,
  ]);

  // Dynamic search across Accounts, Transactions, Bills, Installments, IOUs, Goals
  const matchedEntities: CommandItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: CommandItem[] = [];

    accounts
      .filter((a) => a.name.toLowerCase().includes(q) || a.currency.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((a) => {
        const cur = getAccountBalanceCurrency(a);
        results.push({
          id: `acc-${a.id}`,
          title: a.name,
          subtitle: a.type.replace("_", " "),
          amountText: formatCurrency(a.balance, cur),
          icon: <CreditCard size={16} className="text-blue-400" />,
          action: () => onNavigate("accounts"),
          category: "Accounts",
        });
      });

    transactions
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
      .forEach((tx) => {
        const acc = getAccountById(tx.accountId);
        const cur = getAccountBalanceCurrency(acc);
        results.push({
          id: `tx-${tx.id}`,
          title: tx.note || tx.category,
          subtitle: `${acc?.name ?? "Account"} · ${formatDate(tx.date)}`,
          amountText: formatCurrency(tx.amount, cur),
          icon:
            tx.type === "income" ? (
              <ArrowDownLeft size={16} className="text-emerald-400" />
            ) : tx.type === "expense" ? (
              <ArrowUpRight size={16} className="text-rose-400" />
            ) : (
              <ArrowLeftRight size={16} className="text-sky-400" />
            ),
          action: () => onNavigate("transactions"),
          category: "Transactions",
        });
      });

    recurring
      .filter((b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((b) => {
        const cur = getAccountBalanceCurrency(getAccountById(b.accountId));
        results.push({
          id: `bill-${b.id}`,
          title: b.name,
          subtitle: `Due ${formatDate(b.nextDueDate)} · ${b.frequency}`,
          amountText: formatCurrency(b.amount, cur),
          icon: <CalendarClock size={16} className="text-amber-400" />,
          action: () => onNavigate("commitments"),
          category: "Bills",
        });
      });

    (installments ?? [])
      .filter(
        (inst) =>
          inst.name.toLowerCase().includes(q) ||
          (inst.provider && inst.provider.toLowerCase().includes(q)),
      )
      .slice(0, 3)
      .forEach((inst) => {
        const cur = getAccountBalanceCurrency(getAccountById(inst.accountId));
        results.push({
          id: `inst-${inst.id}`,
          title: inst.name,
          subtitle: `${inst.paidMonths}/${inst.totalMonths} paid${inst.provider ? ` · ${inst.provider}` : ""}`,
          amountText: `${formatCurrency(inst.monthlyAmount, cur)}/mo`,
          icon: <Layers size={16} className="text-indigo-400" />,
          action: () => onNavigate("commitments"),
          category: "Installments",
        });
      });

    ious
      .filter(
        (i) =>
          i.personName.toLowerCase().includes(q) ||
          (i.note && i.note.toLowerCase().includes(q)),
      )
      .slice(0, 3)
      .forEach((i) => {
        const cur = getAccountBalanceCurrency(getAccountById(i.accountId));
        results.push({
          id: `iou-${i.id}`,
          title: i.personName,
          subtitle: `${i.type === "lent" ? "Owed to you" : "You owe"} · ${i.status}`,
          amountText: formatCurrency(i.amount, cur),
          icon: <Users size={16} className="text-emerald-400" />,
          action: () => onNavigate("ious"),
          category: "IOUs",
        });
      });

    savingsGoals
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((g) => {
        results.push({
          id: `goal-${g.id}`,
          title: g.name,
          subtitle: `Savings Goal`,
          amountText: `${formatCurrency(g.currentAmount, g.currency)} / ${formatCurrency(g.targetAmount, g.currency)}`,
          icon: <Target size={16} className="text-teal-400" />,
          action: () => onNavigate("goals"),
          category: "Goals",
        });
      });

    return results;
  }, [
    query,
    accounts,
    transactions,
    recurring,
    installments,
    ious,
    savingsGoals,
    getAccountById,
    onNavigate,
  ]);

  // Combined searchable items
  const filteredItems: CommandItem[] = useMemo(() => {
    if (!query.trim()) {
      return [...quickActions, ...navItems];
    }
    const q = query.toLowerCase();
    const actions = quickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q)),
    );
    const navs = navItems.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.subtitle && n.subtitle.toLowerCase().includes(q)),
    );
    return [...matchedEntities, ...actions, ...navs];
  }, [query, quickActions, navItems, matchedEntities]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) =>
          (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 md:p-20 pt-[calc(1rem+env(safe-area-inset-top))]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-[#111827] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-up flex flex-col max-h-[82dvh]">
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <Search size={18} className="text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none min-h-[32px]"
            placeholder="Search transactions, accounts, bills, IOUs, installments..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden text-xs text-white/50 hover:text-white px-2 py-1"
          >
            Done
          </button>
          <span className="hidden sm:inline-block text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[60dvh]"
        >
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
                  type="button"
                  data-index={index}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 min-h-[48px] rounded-xl text-start transition-all duration-150 ${
                    isSelected
                      ? "bg-blue-500/20 text-white border border-blue-500/30"
                      : "text-white/70 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "bg-blue-500/30 text-white"
                          : "bg-white/[0.05] text-white/60"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-white">
                        {item.title}
                      </p>
                      {(item.subtitle || item.amountText) && (
                        <p className="text-xs text-white/45 truncate flex items-center gap-1.5">
                          {item.subtitle && (
                            <span className="truncate">{item.subtitle}</span>
                          )}
                          {item.amountText && (
                            <span
                              className={`font-semibold text-white/75 tabular-nums flex-shrink-0 ${
                                privacyMode ? "privacy-blur" : ""
                              }`}
                            >
                              · {item.amountText}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/35 font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] flex-shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="hidden sm:flex px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01] items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/70">
                ↑
              </kbd>
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/70">
                ↓
              </kbd>{" "}
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/70">
                ↵
              </kbd>{" "}
              to select
            </span>
          </div>
          <span className="text-blue-400 font-medium">Walleteer Command</span>
        </div>
      </div>
    </div>
  );
}
