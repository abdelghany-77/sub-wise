import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Account, Transaction, Budget, SavingsGoal } from "../types";
import { generateId } from "../lib/utils";
import { DEMO_ACCOUNTS, DEMO_TRANSACTIONS } from "../data/demo";
import { useToastStore } from "./useToastStore";

export interface AppSettings {
  defaultCurrency: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  weekStartsOn: "sunday" | "monday" | "saturday";
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: "EGP",
  dateFormat: "MM/DD/YYYY",
  weekStartsOn: "saturday",
};

interface WealthState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  privacyMode: boolean;
  settings: AppSettings;
  // Actions
  addAccount: (account: Omit<Account, "id" | "createdAt">) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (
    id: string,
    updates: Omit<Transaction, "id" | "createdAt">,
  ) => void;
  deleteTransaction: (id: string) => void;
  // Budgets
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "createdAt">) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeSavingsGoal: (id: string, amount: number) => void;
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  // Data
  importData: (data: {
    accounts: Account[];
    transactions: Transaction[];
    budgets?: Budget[];
    savingsGoals?: SavingsGoal[];
  }) => void;
  clearAll: () => void;
  togglePrivacyMode: () => void;
  // Computed helpers
  getNetWorth: () => number;
  getNetWorthByCurrency: () => Record<string, number>;
  getAccountById: (id: string) => Account | undefined;
  processRecurringTransactions: () => void;
}

function getNextRecurrenceDate(
  lastDate: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
): string {
  const d = new Date(lastDate);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}

/** Check if any budget crossed 80% or 100% after adding an expense */
function checkBudgetAlerts(budgets: Budget[], transactions: Transaction[]) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const spending: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === "expense" && tx.date.startsWith(prefix))
    .forEach((tx) => {
      spending[tx.category] = (spending[tx.category] ?? 0) + tx.amount;
    });

  const { addToast } = useToastStore.getState();

  for (const b of budgets) {
    const spent = spending[b.category] ?? 0;
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    if (pct >= 100) {
      addToast({
        type: "error",
        message: `⚠️ Budget exceeded! "${b.category}" is at ${Math.round(pct)}% (${b.currency} ${spent.toFixed(0)} / ${b.limit.toFixed(0)})`,
        duration: 6000,
      });
    } else if (pct >= 80) {
      addToast({
        type: "warning",
        message: `⚡ "${b.category}" budget is at ${Math.round(pct)}% — getting close to the limit!`,
        duration: 5000,
      });
    }
  }
}

export const useStore = create<WealthState>()(
  persist(
    (set, get) => ({
      accounts: DEMO_ACCOUNTS,
      transactions: DEMO_TRANSACTIONS,
      budgets: [],
      savingsGoals: [],
      privacyMode: false,
      settings: DEFAULT_SETTINGS,

      togglePrivacyMode: () => set((s) => ({ privacyMode: !s.privacyMode })),

      updateSettings: (updates) => {
        set((s) => ({ settings: { ...s.settings, ...updates } }));
      },

      addAccount: (account) => {
        const newAccount: Account = {
          ...account,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ accounts: [...s.accounts, newAccount] }));
      },

      updateAccount: (id, updates) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          transactions: s.transactions.filter(
            (t) => t.accountId !== id && t.toAccountId !== id,
          ),
        }));
      },

      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((s) => {
          const accounts = s.accounts.map((acc) => {
            if (newTx.type === "income" && acc.id === newTx.accountId) {
              return { ...acc, balance: acc.balance + newTx.amount };
            }
            if (newTx.type === "expense" && acc.id === newTx.accountId) {
              return { ...acc, balance: acc.balance - newTx.amount };
            }
            if (newTx.type === "transfer") {
              if (acc.id === newTx.accountId) {
                return { ...acc, balance: acc.balance - newTx.amount };
              }
              if (acc.id === newTx.toAccountId) {
                return { ...acc, balance: acc.balance + newTx.amount };
              }
            }
            return acc;
          });
          return { accounts, transactions: [newTx, ...s.transactions] };
        });

        // Check budget alerts after expense
        if (tx.type === "expense") {
          const { budgets, transactions } = get();
          checkBudgetAlerts(budgets, transactions);
        }
      },

      updateTransaction: (id, updates) => {
        const { transactions } = get();
        const oldTx = transactions.find((t) => t.id === id);
        if (!oldTx) return;

        set((s) => {
          // First reverse the old transaction's balance effect
          let accounts = s.accounts.map((acc) => {
            if (oldTx.type === "income" && acc.id === oldTx.accountId) {
              return { ...acc, balance: acc.balance - oldTx.amount };
            }
            if (oldTx.type === "expense" && acc.id === oldTx.accountId) {
              return { ...acc, balance: acc.balance + oldTx.amount };
            }
            if (oldTx.type === "transfer") {
              if (acc.id === oldTx.accountId)
                return { ...acc, balance: acc.balance + oldTx.amount };
              if (acc.id === oldTx.toAccountId)
                return { ...acc, balance: acc.balance - oldTx.amount };
            }
            return acc;
          });

          // Then apply the new transaction's balance effect
          accounts = accounts.map((acc) => {
            if (updates.type === "income" && acc.id === updates.accountId) {
              return { ...acc, balance: acc.balance + updates.amount };
            }
            if (updates.type === "expense" && acc.id === updates.accountId) {
              return { ...acc, balance: acc.balance - updates.amount };
            }
            if (updates.type === "transfer") {
              if (acc.id === updates.accountId)
                return { ...acc, balance: acc.balance - updates.amount };
              if (acc.id === updates.toAccountId)
                return { ...acc, balance: acc.balance + updates.amount };
            }
            return acc;
          });

          const updatedTransactions = s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          );

          return { accounts, transactions: updatedTransactions };
        });
      },

      deleteTransaction: (id) => {
        const { transactions } = get();
        const tx = transactions.find((t) => t.id === id);
        if (!tx) return;

        // Reverse the balance effect
        set((s) => {
          const updatedAccounts = s.accounts.map((acc) => {
            if (tx.type === "income" && acc.id === tx.accountId) {
              return { ...acc, balance: acc.balance - tx.amount };
            }
            if (tx.type === "expense" && acc.id === tx.accountId) {
              return { ...acc, balance: acc.balance + tx.amount };
            }
            if (tx.type === "transfer") {
              if (acc.id === tx.accountId) {
                return { ...acc, balance: acc.balance + tx.amount };
              }
              if (acc.id === tx.toAccountId) {
                return { ...acc, balance: acc.balance - tx.amount };
              }
            }
            return acc;
          });
          return {
            accounts: updatedAccounts,
            transactions: s.transactions.filter((t) => t.id !== id),
          };
        });
      },

      // Budgets
      addBudget: (budget) => {
        const newBudget: Budget = {
          ...budget,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ budgets: [...s.budgets, newBudget] }));
      },

      updateBudget: (id, updates) => {
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id ? { ...b, ...updates } : b,
          ),
        }));
      },

      deleteBudget: (id) => {
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
      },

      // Savings Goals
      addSavingsGoal: (goal) => {
        const newGoal: SavingsGoal = {
          ...goal,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ savingsGoals: [...s.savingsGoals, newGoal] }));
      },

      updateSavingsGoal: (id, updates) => {
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g,
          ),
        }));
      },

      deleteSavingsGoal: (id) => {
        set((s) => ({
          savingsGoals: s.savingsGoals.filter((g) => g.id !== id),
        }));
      },

      contributeSavingsGoal: (id, amount) => {
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g,
          ),
        }));
      },

      importData: (data) => {
        set({
          accounts: data.accounts,
          transactions: data.transactions,
          budgets: data.budgets ?? [],
          savingsGoals: data.savingsGoals ?? [],
        });
      },

      clearAll: () => {
        set({ accounts: [], transactions: [], budgets: [], savingsGoals: [] });
      },

      getNetWorth: () => {
        return get().accounts.reduce((sum, acc) => sum + acc.balance, 0);
      },

      getNetWorthByCurrency: () => {
        const byCurrency: Record<string, number> = {};
        for (const acc of get().accounts) {
          byCurrency[acc.currency] =
            (byCurrency[acc.currency] ?? 0) + acc.balance;
        }
        return byCurrency;
      },

      getAccountById: (id) => {
        return get().accounts.find((a) => a.id === id);
      },

      processRecurringTransactions: () => {
        const { transactions } = get();
        const today = new Date().toISOString().split("T")[0];
        const recurringTemplates = transactions.filter(
          (tx) => tx.isRecurring && tx.recurrenceFrequency,
        );

        for (const template of recurringTemplates) {
          // Check if end date passed
          if (template.recurrenceEndDate && template.recurrenceEndDate < today)
            continue;

          // Find last generated transaction from this template
          const generated = transactions
            .filter((t) => t.parentRecurringId === template.id)
            .sort((a, b) => b.date.localeCompare(a.date));

          const lastDate =
            generated.length > 0 ? generated[0].date : template.date;
          const nextDate = getNextRecurrenceDate(
            lastDate,
            template.recurrenceFrequency!,
          );

          if (nextDate && nextDate <= today) {
            // Auto-generate the next transaction
            get().addTransaction({
              type: template.type,
              amount: template.amount,
              category: template.category,
              note: template.note,
              date: nextDate,
              accountId: template.accountId,
              toAccountId: template.toAccountId,
              parentRecurringId: template.id,
            });
          }
        }
      },
    }),
    {
      name: "subwise-wealth-data",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
