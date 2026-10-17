import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Account,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringBill,
  Iou,
  ExchangeRates,
  SafeToSpendResult,
  NetWorthBreakdown,
} from "../types";
import { DEFAULT_EXCHANGE_RATES } from "../types";
import { generateId } from "../lib/utils";
import { DEMO_ACCOUNTS, DEMO_TRANSACTIONS } from "../data/demo";
import { useToastStore } from "./useToastStore";

// Migrate localStorage key from old "subwise-wealth-data" to "walleteer-wealth-data"
(function migrateStorageKey() {
  const OLD_KEY = "subwise-wealth-data";
  const NEW_KEY = "walleteer-wealth-data";
  try {
    const oldData = localStorage.getItem(OLD_KEY);
    if (oldData && !localStorage.getItem(NEW_KEY)) {
      localStorage.setItem(NEW_KEY, oldData);
      localStorage.removeItem(OLD_KEY);
    }
  } catch {
    // Silently ignore storage errors
  }
})();

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

export const INITIAL_RECURRING: RecurringBill[] = [
  {
    id: "rec-1",
    name: "Home Internet & Fiber",
    amount: 520,
    frequency: "monthly",
    nextDueDate: new Date(Date.now() + 3 * 864e5).toISOString().split("T")[0],
    accountId: "acc-1",
    type: "expense",
    category: "Utilities",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rec-2",
    name: "Gym & Fitness Membership",
    amount: 1200,
    frequency: "monthly",
    nextDueDate: new Date(Date.now() + 5 * 864e5).toISOString().split("T")[0],
    accountId: "acc-1",
    type: "expense",
    category: "Personal Care",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rec-3",
    name: "Netflix & Spotify Bundle",
    amount: 450,
    frequency: "monthly",
    nextDueDate: new Date(Date.now() + 12 * 864e5).toISOString().split("T")[0],
    accountId: "acc-1",
    type: "expense",
    category: "Subscriptions",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_IOUS: Iou[] = [
  {
    id: "iou-1",
    personName: "Ahmed Tarek",
    amount: 2500,
    type: "lent", // Owed to user (ليا بره)
    accountId: "acc-1",
    dueDate: new Date(Date.now() + 10 * 864e5).toISOString().split("T")[0],
    note: "Emergency weekend loan",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "iou-2",
    personName: "Mohamed Samir",
    amount: 1400,
    type: "borrowed", // User owes (عليا)
    accountId: "acc-1",
    dueDate: new Date(Date.now() + 15 * 864e5).toISOString().split("T")[0],
    note: "Group dinner split contribution",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

interface WealthState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurring: RecurringBill[];
  ious: Iou[];
  exchangeRates: ExchangeRates;
  monthlyBudgetTarget: number;
  lastBackupDate: string | null;
  transactionsSinceLastBackup: number;
  privacyMode: boolean;
  settings: AppSettings;

  // Actions - Core
  togglePrivacyMode: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Accounts
  addAccount: (account: Omit<Account, "id" | "createdAt">) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  reconcileAccountBalance: (
    accountId: string,
    actualBalance: number,
    note?: string,
  ) => void;

  // Transactions
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

  // Recurring & Subscriptions
  addRecurringBill: (bill: Omit<RecurringBill, "id" | "createdAt">) => void;
  updateRecurringBill: (id: string, updates: Partial<RecurringBill>) => void;
  deleteRecurringBill: (id: string) => void;
  markBillAsPaid: (id: string, customDate?: string) => void;

  // IOUs (Lent / Borrowed)
  addIou: (
    iou: Omit<Iou, "id" | "createdAt" | "status">,
    deductFromAccount?: boolean,
  ) => void;
  updateIou: (id: string, updates: Partial<Iou>) => void;
  deleteIou: (id: string) => void;
  settleIou: (id: string, targetAccountId?: string) => void;

  // Multi-Currency & Gold Asset Vault
  updateExchangeRates: (rates: Partial<ExchangeRates>) => void;

  // Safe-To-Spend Daily Engine
  setMonthlyBudgetTarget: (target: number) => void;
  getSafeToSpend: () => SafeToSpendResult;

  // Backup Indicator
  recordBackup: () => void;
  isBackupNeeded: () => boolean;

  // Data
  importData: (data: {
    accounts: Account[];
    transactions: Transaction[];
    budgets?: Budget[];
    savingsGoals?: SavingsGoal[];
    recurring?: RecurringBill[];
    ious?: Iou[];
    exchangeRates?: ExchangeRates;
    monthlyBudgetTarget?: number;
    lastBackupDate?: string | null;
  }) => void;
  clearAll: () => void;

  // Computed helpers
  getNetWorth: () => number;
  getNetWorthBreakdown: () => NetWorthBreakdown;
  getNetWorthByCurrency: () => Record<string, number>;
  getAccountById: (id: string) => Account | undefined;
  getAccount30DayNetFlow: (accountId: string) => number;
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
    .filter((tx) => tx.type === "expense" && tx.date.startsWith(prefix) && !tx.isIou)
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
      recurring: INITIAL_RECURRING,
      ious: INITIAL_IOUS,
      exchangeRates: DEFAULT_EXCHANGE_RATES,
      monthlyBudgetTarget: 0,
      lastBackupDate: null,
      transactionsSinceLastBackup: 0,
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
        // Auto calculate balance from units & exchange rates if foreign or gold
        if (
          newAccount.assetType &&
          newAccount.assetType !== "standard" &&
          newAccount.unitBalance !== undefined &&
          newAccount.exchangeRateToBase !== undefined
        ) {
          newAccount.balance = newAccount.unitBalance * newAccount.exchangeRateToBase;
        }

        set((s) => ({ accounts: [...s.accounts, newAccount] }));
      },

      updateAccount: (id, updates) => {
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== id) return a;
            const updated = { ...a, ...updates };
            if (
              updated.assetType &&
              updated.assetType !== "standard" &&
              updated.unitBalance !== undefined &&
              updated.exchangeRateToBase !== undefined
            ) {
              updated.balance = updated.unitBalance * updated.exchangeRateToBase;
            }
            return updated;
          }),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          transactions: s.transactions.filter(
            (t) => t.accountId !== id && t.toAccountId !== id,
          ),
          recurring: s.recurring.filter((r) => r.accountId !== id),
          ious: s.ious.filter((i) => i.accountId !== id),
        }));
      },

      reconcileAccountBalance: (accountId, actualBalance, note) => {
        const account = get().accounts.find((a) => a.id === accountId);
        if (!account) return;

        const diff = actualBalance - account.balance;
        if (Math.abs(diff) < 0.001) return; // No difference

        const today = new Date().toISOString().split("T")[0];
        const isPositive = diff > 0;

        const reconciliationTx: Omit<Transaction, "id" | "createdAt"> = {
          type: isPositive ? "income" : "expense",
          amount: Math.abs(diff),
          category: "Adjustment",
          note: note || "Balance Reconciliation / تسوية رصيد",
          date: today,
          accountId,
          isReconciliation: true,
        };

        // Adding this transaction will update account.balance automatically
        get().addTransaction(reconciliationTx);

        // Also adjust unitBalance if account is foreign currency or gold
        if (
          account.assetType &&
          account.assetType !== "standard" &&
          account.exchangeRateToBase &&
          account.exchangeRateToBase > 0
        ) {
          const newUnits = actualBalance / account.exchangeRateToBase;
          get().updateAccount(accountId, { unitBalance: newUnits });
        }

        useToastStore.getState().addToast({
          type: "success",
          message: `Balance reconciled for ${account.name} (Diff: ${diff > 0 ? "+" : ""}${diff.toFixed(2)} ${account.currency})`,
        });
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
              const newBalance = acc.balance + newTx.amount;
              const unitBalance =
                acc.exchangeRateToBase && acc.exchangeRateToBase > 0
                  ? newBalance / acc.exchangeRateToBase
                  : acc.unitBalance;
              return { ...acc, balance: newBalance, unitBalance };
            }
            if (newTx.type === "expense" && acc.id === newTx.accountId) {
              const newBalance = acc.balance - newTx.amount;
              const unitBalance =
                acc.exchangeRateToBase && acc.exchangeRateToBase > 0
                  ? newBalance / acc.exchangeRateToBase
                  : acc.unitBalance;
              return { ...acc, balance: newBalance, unitBalance };
            }
            if (newTx.type === "transfer") {
              if (acc.id === newTx.accountId) {
                const newBalance = acc.balance - newTx.amount;
                const unitBalance =
                  acc.exchangeRateToBase && acc.exchangeRateToBase > 0
                    ? newBalance / acc.exchangeRateToBase
                    : acc.unitBalance;
                return { ...acc, balance: newBalance, unitBalance };
              }
              if (acc.id === newTx.toAccountId) {
                const newBalance = acc.balance + newTx.amount;
                const unitBalance =
                  acc.exchangeRateToBase && acc.exchangeRateToBase > 0
                    ? newBalance / acc.exchangeRateToBase
                    : acc.unitBalance;
                return { ...acc, balance: newBalance, unitBalance };
              }
            }
            return acc;
          });

          return {
            accounts,
            transactions: [newTx, ...s.transactions],
            transactionsSinceLastBackup: s.transactionsSinceLastBackup + 1,
          };
        });

        // Check budget alerts after expense (unless it's an IOU)
        if (tx.type === "expense" && !tx.isIou) {
          const { budgets, transactions } = get();
          checkBudgetAlerts(budgets, transactions);
        }
      },

      updateTransaction: (id, updates) => {
        const { transactions } = get();
        const oldTx = transactions.find((t) => t.id === id);
        if (!oldTx) return;

        set((s) => {
          // Revert old effect
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

          // Apply new effect
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

          // Keep unit balances synced if foreign
          accounts = accounts.map((acc) => {
            if (acc.exchangeRateToBase && acc.exchangeRateToBase > 0) {
              return { ...acc, unitBalance: acc.balance / acc.exchangeRateToBase };
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
          }).map((acc) => {
            if (acc.exchangeRateToBase && acc.exchangeRateToBase > 0) {
              return { ...acc, unitBalance: acc.balance / acc.exchangeRateToBase };
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

      // Recurring Bills & Subscriptions
      addRecurringBill: (bill) => {
        const newBill: RecurringBill = {
          ...bill,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ recurring: [...s.recurring, newBill] }));
        useToastStore.getState().addToast({
          type: "success",
          message: `Recurring bill "${bill.name}" added successfully`,
        });
      },

      updateRecurringBill: (id, updates) => {
        set((s) => ({
          recurring: s.recurring.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        }));
      },

      deleteRecurringBill: (id) => {
        set((s) => ({
          recurring: s.recurring.filter((r) => r.id !== id),
        }));
      },

      markBillAsPaid: (id, customDate) => {
        const bill = get().recurring.find((r) => r.id === id);
        if (!bill) return;

        const date = customDate || new Date().toISOString().split("T")[0];

        // 1. Log transaction into chosen account
        get().addTransaction({
          type: bill.type,
          amount: bill.amount,
          category: bill.category,
          note: `Recurring: ${bill.name} (Auto-logged)`,
          date,
          accountId: bill.accountId,
        });

        // 2. Advance nextDueDate by 1 cycle (month or year)
        const nextDate = getNextRecurrenceDate(bill.nextDueDate, bill.frequency);
        get().updateRecurringBill(id, { nextDueDate: nextDate });

        useToastStore.getState().addToast({
          type: "success",
          message: `Paid "${bill.name}". Next due date updated to ${nextDate}`,
        });
      },

      // IOUs: Split, Lent & Borrowed
      addIou: (iou, deductFromAccount = true) => {
        const newId = generateId();
        const newIou: Iou = {
          ...iou,
          id: newId,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        set((s) => ({ ious: [newIou, ...s.ious] }));

        // Deduct from account if lent, or deposit if borrowed
        if (deductFromAccount && iou.accountId) {
          const today = new Date().toISOString().split("T")[0];
          if (iou.type === "lent") {
            // Deduct from account balance, marked as IOU so excluded from personal spending categories
            get().addTransaction({
              type: "expense",
              amount: iou.amount,
              category: "Lent / دين مستحق",
              note: `Lent to ${iou.personName}${iou.note ? ` - ${iou.note}` : ""}`,
              date: today,
              accountId: iou.accountId,
              isIou: true,
              iouId: newId,
            });
          } else if (iou.type === "borrowed") {
            // Add cash to account
            get().addTransaction({
              type: "income",
              amount: iou.amount,
              category: "Other",
              note: `Borrowed from ${iou.personName}${iou.note ? ` - ${iou.note}` : ""}`,
              date: today,
              accountId: iou.accountId,
              isIou: true,
              iouId: newId,
            });
          }
        }

        useToastStore.getState().addToast({
          type: "success",
          message: `IOU record created for ${iou.personName} (${iou.amount.toLocaleString()} EGP)`,
        });
      },

      updateIou: (id, updates) => {
        set((s) => ({
          ious: s.ious.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
      },

      deleteIou: (id) => {
        set((s) => ({
          ious: s.ious.filter((i) => i.id !== id),
        }));
      },

      settleIou: (id, targetAccountId) => {
        const iou = get().ious.find((i) => i.id === id);
        if (!iou || iou.status === "settled") return;

        const settleAccountId = targetAccountId || iou.accountId;
        const today = new Date().toISOString().split("T")[0];

        // Mark settled
        set((s) => ({
          ious: s.ious.map((i) =>
            i.id === id
              ? { ...i, status: "settled", settledDate: today }
              : i,
          ),
        }));

        // Return money / pay back
        if (iou.type === "lent") {
          // Returning money to user's account
          get().addTransaction({
            type: "income",
            amount: iou.amount,
            category: "Settlement / سداد دين",
            note: `Settlement from ${iou.personName} / استرداد سلفة`,
            date: today,
            accountId: settleAccountId,
            isIou: true,
            iouId: id,
          });
          useToastStore.getState().addToast({
            type: "success",
            message: `Settled! Received ${iou.amount.toLocaleString()} EGP back from ${iou.personName}`,
          });
        } else {
          // User repaying borrowed debt
          get().addTransaction({
            type: "expense",
            amount: iou.amount,
            category: "Settlement / سداد دين",
            note: `Repaid debt to ${iou.personName} / سداد دين`,
            date: today,
            accountId: settleAccountId,
            isIou: true,
            iouId: id,
          });
          useToastStore.getState().addToast({
            type: "success",
            message: `Settled! Repaid ${iou.amount.toLocaleString()} EGP to ${iou.personName}`,
          });
        }
      },

      updateExchangeRates: (rates) => {
        set((s) => {
          const newRates: ExchangeRates = {
            ...s.exchangeRates,
            ...(rates as Record<string, number>),
          };
          // Recalculate accounts that have unitBalance and matching currency/gold rate
          const updatedAccounts = s.accounts.map((acc) => {
            if (acc.assetType === "standard" || !acc.assetType) return acc;

            let currentRate = acc.exchangeRateToBase;
            if (acc.assetType === "gold_24k" && rates.GOLD_24K) {
              currentRate = rates.GOLD_24K;
            } else if (acc.assetType === "gold_21k" && rates.GOLD_21K) {
              currentRate = rates.GOLD_21K;
            } else if (acc.currency === "USD" && rates.USD) {
              currentRate = rates.USD;
            } else if (acc.currency === "EUR" && rates.EUR) {
              currentRate = rates.EUR;
            } else if (acc.currency === "SAR" && rates.SAR) {
              currentRate = rates.SAR;
            }

            if (currentRate && acc.unitBalance !== undefined) {
              return {
                ...acc,
                exchangeRateToBase: currentRate,
                balance: acc.unitBalance * currentRate,
              };
            }
            return acc;
          });

          return { exchangeRates: newRates, accounts: updatedAccounts };
        });

        useToastStore.getState().addToast({
          type: "info",
          message: "Live asset exchange rates updated successfully",
        });
      },

      // Safe-To-Spend Daily Allowance Engine
      setMonthlyBudgetTarget: (target) => {
        set({ monthlyBudgetTarget: target });
      },

      getSafeToSpend: () => {
        const { transactions, recurring, monthlyBudgetTarget } = get();
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed
        const currentDay = now.getDate();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const remainingDays = Math.max(1, daysInMonth - currentDay + 1);

        const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

        // 1. Month-to-date variable expenses (excluding transfers & lent IOUs)
        const monthToDateExpenses = transactions
          .filter(
            (tx) =>
              tx.type === "expense" &&
              tx.date.startsWith(currentMonthPrefix) &&
              !tx.isIou,
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        // 2. Month-to-date income
        const monthToDateIncome = transactions
          .filter(
            (tx) =>
              tx.type === "income" &&
              tx.date.startsWith(currentMonthPrefix) &&
              !tx.isIou,
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        // 3. Fixed Upcoming Bills due between today and end of current month
        const todayStr = now.toISOString().split("T")[0];
        const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

        const fixedUpcomingBills = recurring
          .filter(
            (r) =>
              r.type === "expense" &&
              r.nextDueDate >= todayStr &&
              r.nextDueDate <= endOfMonthStr,
          )
          .reduce((sum, r) => sum + r.amount, 0);

        // Formula: (Monthly Target Budget OR Monthly Income - Fixed Upcoming Bills - Month-to-Date Variable Expenses) / Remaining Days
        const monthlyBase = monthlyBudgetTarget > 0 ? monthlyBudgetTarget : monthToDateIncome;
        const totalRemaining = monthlyBase - fixedUpcomingBills - monthToDateExpenses;
        const dailyAllowance = Math.round(totalRemaining / remainingDays);

        // Status classification
        let status: "safe" | "caution" | "overpace" = "safe";
        const benchmarkDaily = monthlyBase > 0 ? monthlyBase / daysInMonth : 0;

        if (totalRemaining <= 0 || dailyAllowance <= 0) {
          status = "overpace";
        } else if (benchmarkDaily > 0 && dailyAllowance < benchmarkDaily * 0.75) {
          status = "caution";
        }

        return {
          dailyAllowance: Math.max(0, dailyAllowance),
          totalRemaining,
          remainingDays,
          daysInMonth,
          currentDay,
          status,
          monthlyBase,
          fixedUpcomingBills,
          monthToDateExpenses,
        };
      },

      // Backup Health Tracking
      recordBackup: () => {
        set({
          lastBackupDate: new Date().toISOString(),
          transactionsSinceLastBackup: 0,
        });
      },

      isBackupNeeded: () => {
        const { lastBackupDate, transactionsSinceLastBackup, transactions } = get();
        if (transactions.length === 0) return false;
        if (transactionsSinceLastBackup >= 15) return true;
        if (!lastBackupDate) return transactions.length >= 5;

        const daysSinceBackup =
          (Date.now() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceBackup >= 7 && transactionsSinceLastBackup > 0;
      },

      // Net Worth Breakdown
      getNetWorthBreakdown: () => {
        const { accounts, budgets, ious } = get();

        // 1. Liquid Cash (Bank, Wallet, Card non-savings, standard currency)
        let liquidCash = 0;
        let hardAssets = 0;

        for (const acc of accounts) {
          const isHardAsset =
            acc.type === "savings" ||
            acc.type === "investment" ||
            acc.assetType === "gold_24k" ||
            acc.assetType === "gold_21k" ||
            acc.assetType === "foreign_currency";

          if (isHardAsset) {
            hardAssets += acc.balance;
          } else {
            liquidCash += acc.balance;
          }
        }

        // 2. Receivables: Pending Lent IOUs (money owed to user)
        const receivables = ious
          .filter((i) => i.status === "pending" && i.type === "lent")
          .reduce((sum, i) => sum + i.amount, 0);

        // 3. Payables: Pending Borrowed IOUs (money user owes)
        const payables = ious
          .filter((i) => i.status === "pending" && i.type === "borrowed")
          .reduce((sum, i) => sum + i.amount, 0);

        // 4. Committed Budgets
        const committedBudgets = budgets
          .filter((b) => b.deductFromNetWorth)
          .reduce((sum, b) => sum + b.limit, 0);

        const totalNetWorth =
          liquidCash + hardAssets + receivables - payables - committedBudgets;

        return {
          liquidCash,
          hardAssets,
          receivables,
          payables,
          committedBudgets,
          totalNetWorth,
        };
      },

      getNetWorth: () => {
        return get().getNetWorthBreakdown().totalNetWorth;
      },

      getNetWorthByCurrency: () => {
        const byCurrency: Record<string, number> = {};
        for (const acc of get().accounts) {
          if (acc.type === "savings") continue;
          byCurrency[acc.currency] =
            (byCurrency[acc.currency] ?? 0) + acc.balance;
        }
        for (const b of get().budgets) {
          if (b.deductFromNetWorth && b.limit > 0) {
            const cur = b.currency || get().accounts[0]?.currency || "EGP";
            byCurrency[cur] = (byCurrency[cur] ?? 0) - b.limit;
          }
        }
        return byCurrency;
      },

      getAccountById: (id) => {
        return get().accounts.find((a) => a.id === id);
      },

      getAccount30DayNetFlow: (accountId) => {
        const { transactions } = get();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0];

        let net = 0;
        for (const tx of transactions) {
          if (tx.date < thirtyDaysAgo) continue;
          if (tx.accountId === accountId) {
            if (tx.type === "income") net += tx.amount;
            else if (tx.type === "expense") net -= tx.amount;
            else if (tx.type === "transfer") net -= tx.amount;
          }
          if (tx.type === "transfer" && tx.toAccountId === accountId) {
            net += tx.amount;
          }
        }
        return net;
      },

      importData: (data) => {
        set({
          accounts: data.accounts,
          transactions: data.transactions,
          budgets: data.budgets ?? [],
          savingsGoals: data.savingsGoals ?? [],
          recurring: data.recurring ?? INITIAL_RECURRING,
          ious: data.ious ?? INITIAL_IOUS,
          exchangeRates: data.exchangeRates ?? DEFAULT_EXCHANGE_RATES,
          monthlyBudgetTarget: data.monthlyBudgetTarget ?? 0,
          lastBackupDate: data.lastBackupDate ?? new Date().toISOString(),
          transactionsSinceLastBackup: 0,
        });
      },

      clearAll: () => {
        set({
          accounts: [],
          transactions: [],
          budgets: [],
          savingsGoals: [],
          recurring: [],
          ious: [],
          transactionsSinceLastBackup: 0,
        });
      },

      processRecurringTransactions: () => {
        const { transactions } = get();
        const today = new Date().toISOString().split("T")[0];
        const recurringTemplates = transactions.filter(
          (tx) => tx.isRecurring && tx.recurrenceFrequency,
        );

        for (const template of recurringTemplates) {
          if (template.recurrenceEndDate && template.recurrenceEndDate < today)
            continue;

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
      name: "walleteer-wealth-data",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState;
        }
        const state = persistedState as Record<string, unknown>;
        return {
          ...state,
          recurring: state.recurring || INITIAL_RECURRING,
          ious: state.ious || INITIAL_IOUS,
          exchangeRates: {
            ...DEFAULT_EXCHANGE_RATES,
            ...((state.exchangeRates as Record<string, number>) || {}),
          },
          monthlyBudgetTarget: state.monthlyBudgetTarget ?? 0,
          lastBackupDate: state.lastBackupDate ?? null,
          transactionsSinceLastBackup: state.transactionsSinceLastBackup ?? 0,
        };
      },
    },
  ),
);
