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
import {
  generateId,
  getFinancialCycle,
  todayISO,
  addDaysISO,
  nextRecurrenceDate,
  parseLocalDate,
  accountBalanceInBase,
  setDateFormatPreference,
} from "../lib/utils";
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
  dateFormat: "MMM D, YYYY" | "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  weekStartsOn: "sunday" | "monday" | "saturday";
  monthStartsOnDay: number; // 1 to 31 (e.g. 26 for salary payday)
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: "EGP",
  dateFormat: "MMM D, YYYY",
  weekStartsOn: "saturday",
  monthStartsOnDay: 1,
};

export const INITIAL_RECURRING: RecurringBill[] = [
  {
    id: "rec-1",
    name: "Home Internet & Fiber",
    amount: 520,
    frequency: "monthly",
    nextDueDate: addDaysISO(3),
    accountId: "acc-1",
    type: "expense",
    category: "Utilities",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rec-2",
    name: "Gym & Fitness Membership",
    amount: 1200,
    frequency: "monthly",
    nextDueDate: addDaysISO(5),
    accountId: "acc-1",
    type: "expense",
    category: "Personal Care",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rec-3",
    name: "Netflix & Spotify Bundle",
    amount: 450,
    frequency: "monthly",
    nextDueDate: addDaysISO(12),
    accountId: "acc-1",
    type: "expense",
    category: "Subscriptions",
    status: "active",
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
    dueDate: addDaysISO(10),
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
    dueDate: addDaysISO(15),
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
  /** When the goal has a linked account and `fromAccountId` is given, the amount is transferred into it. */
  contributeSavingsGoal: (
    id: string,
    amount: number,
    fromAccountId?: string,
  ) => void;

  // Recurring & Subscriptions
  addRecurringBill: (bill: Omit<RecurringBill, "id" | "createdAt">) => void;
  updateRecurring: (id: string, updates: Partial<RecurringBill>) => void;
  updateRecurringBill: (id: string, updates: Partial<RecurringBill>) => void;
  toggleRecurringStatus: (id: string) => void;
  deleteRecurringBill: (id: string) => void;
  deleteRecurring: (id: string) => void;
  markBillAsPaid: (id: string, customDate?: string) => void;

  // IOUs (Lent / Borrowed)
  addIou: (
    iou: Omit<Iou, "id" | "createdAt" | "status">,
    deductFromAccount?: boolean,
  ) => void;
  updateIou: (id: string, updates: Partial<Iou>) => void;
  /** When `reverseTransactions` is true the IOU's ledger entries are deleted and balances restored. */
  deleteIou: (id: string, reverseTransactions?: boolean) => void;
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
    settings?: Partial<AppSettings>;
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

/** Keeps foreign-currency / gold unit balances in sync with their base balance. */
function syncUnitBalances(accounts: Account[]): Account[] {
  return accounts.map((acc) =>
    acc.exchangeRateToBase && acc.exchangeRateToBase > 0
      ? { ...acc, unitBalance: acc.balance / acc.exchangeRateToBase }
      : acc,
  );
}

/** Returns accounts with the balance effect of `tx` undone. */
function reverseTransactionEffect(
  accounts: Account[],
  tx: Transaction,
): Account[] {
  return syncUnitBalances(
    accounts.map((acc) => {
      if (tx.type === "income" && acc.id === tx.accountId) {
        return { ...acc, balance: acc.balance - tx.amount };
      }
      if (tx.type === "expense" && acc.id === tx.accountId) {
        return { ...acc, balance: acc.balance + tx.amount };
      }
      if (tx.type === "transfer") {
        if (acc.id === tx.accountId)
          return { ...acc, balance: acc.balance + tx.amount };
        if (acc.id === tx.toAccountId)
          return { ...acc, balance: acc.balance - tx.amount };
      }
      return acc;
    }),
  );
}

const isSettlementTx = (tx: Transaction) =>
  tx.category.startsWith("Settlement");

/** Warn when the budget for the just-spent category crosses 80% or 100% */
function checkBudgetAlerts(
  budgets: Budget[],
  transactions: Transaction[],
  category: string,
  monthStartsOnDay = 1,
) {
  const cycle = getFinancialCycle(new Date(), monthStartsOnDay);

  const spending: Record<string, number> = {};
  transactions
    .filter(
      (tx) =>
        tx.type === "expense" && cycle.isDateInCycle(tx.date) && !tx.isIou,
    )
    .forEach((tx) => {
      spending[tx.category] = (spending[tx.category] ?? 0) + tx.amount;
    });

  const { addToast } = useToastStore.getState();

  for (const b of budgets) {
    if (b.category !== category) continue;
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
        set((s) => {
          const next = { ...s.settings, ...updates };
          if (updates.dateFormat) {
            setDateFormatPreference(next.dateFormat);
          }
          return { settings: next };
        });
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
          newAccount.balance =
            newAccount.unitBalance * newAccount.exchangeRateToBase;
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
              updated.balance =
                updated.unitBalance * updated.exchangeRateToBase;
            }
            return updated;
          }),
        }));
      },

      deleteAccount: (id) => {
        set((s) => {
          let accounts = s.accounts.filter((a) => a.id !== id);
          // Transfers touching the deleted account are removed, so restore the other side
          for (const tx of s.transactions) {
            if (
              tx.type === "transfer" &&
              (tx.accountId === id || tx.toAccountId === id)
            ) {
              accounts = reverseTransactionEffect(accounts, tx);
            }
          }
          return {
            accounts,
            transactions: s.transactions.filter(
              (t) => t.accountId !== id && t.toAccountId !== id,
            ),
            recurring: s.recurring.filter((r) => r.accountId !== id),
            ious: s.ious.filter((i) => i.accountId !== id),
            savingsGoals: s.savingsGoals.map((g) =>
              g.accountId === id ? { ...g, accountId: undefined } : g,
            ),
            budgets: s.budgets.map((b) =>
              b.accountId === id ? { ...b, accountId: undefined } : b,
            ),
          };
        });
      },

      reconcileAccountBalance: (accountId, actualBalance, note) => {
        const account = get().accounts.find((a) => a.id === accountId);
        if (!account) return;

        const diff = actualBalance - account.balance;
        if (Math.abs(diff) < 0.001) return; // No difference

        const today = todayISO();
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
          const { budgets, transactions, settings } = get();
          checkBudgetAlerts(
            budgets,
            transactions,
            tx.category,
            settings.monthStartsOnDay || 1,
          );
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
              return {
                ...acc,
                unitBalance: acc.balance / acc.exchangeRateToBase,
              };
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

        set((s) => ({
          accounts: reverseTransactionEffect(s.accounts, tx),
          transactions: s.transactions.filter((t) => t.id !== id),
          // Deleting a settlement entry re-opens the IOU it closed
          ious:
            tx.iouId && isSettlementTx(tx)
              ? s.ious.map((i) =>
                  i.id === tx.iouId
                    ? {
                        ...i,
                        status: "pending" as const,
                        settledDate: undefined,
                      }
                    : i,
                )
              : s.ious,
        }));
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

      contributeSavingsGoal: (id, amount, fromAccountId) => {
        const goal = get().savingsGoals.find((g) => g.id === id);
        if (!goal || !(amount > 0)) return;

        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g,
          ),
        }));

        if (
          fromAccountId &&
          goal.accountId &&
          fromAccountId !== goal.accountId
        ) {
          get().addTransaction({
            type: "transfer",
            amount,
            category: "Transfer",
            note: `Savings goal: ${goal.name}`,
            date: todayISO(),
            accountId: fromAccountId,
            toAccountId: goal.accountId,
          });
        }
      },

      // Recurring Bills & Subscriptions
      addRecurringBill: (bill) => {
        const newBill: RecurringBill = {
          ...bill,
          id: generateId(),
          status: bill.status || "active",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ recurring: [...s.recurring, newBill] }));
        useToastStore.getState().addToast({
          type: "success",
          message: `Recurring bill "${bill.name}" added successfully`,
        });
      },

      updateRecurring: (id, updates) => {
        set((s) => ({
          recurring: s.recurring.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...updates,
                  // A manually edited due date resets the month-end anchor
                  ...(updates.nextDueDate && updates.anchorDay === undefined
                    ? { anchorDay: undefined }
                    : {}),
                }
              : r,
          ),
        }));
        useToastStore.getState().addToast({
          type: "info",
          message: `Recurring commitment updated`,
        });
      },

      updateRecurringBill: (id, updates) => {
        get().updateRecurring(id, updates);
      },

      toggleRecurringStatus: (id) => {
        const bill = get().recurring.find((r) => r.id === id);
        if (!bill) return;
        const currentStatus = bill.status ?? "active";
        const nextStatus = currentStatus === "active" ? "paused" : "active";
        set((s) => ({
          recurring: s.recurring.map((r) =>
            r.id === id ? { ...r, status: nextStatus } : r,
          ),
        }));
        useToastStore.getState().addToast({
          type: "info",
          message: `"${bill.name}" is now ${nextStatus === "active" ? "Active" : "Paused"}`,
        });
      },

      deleteRecurringBill: (id) => {
        set((s) => ({
          recurring: s.recurring.filter((r) => r.id !== id),
        }));
        useToastStore.getState().addToast({
          type: "info",
          message: "Commitment deleted",
        });
      },

      deleteRecurring: (id) => {
        get().deleteRecurringBill(id);
      },

      markBillAsPaid: (id, customDate) => {
        const bill = get().recurring.find((r) => r.id === id);
        if (!bill) return;

        const today = todayISO();
        const date = customDate || today;

        // 1. Log transaction into chosen account
        get().addTransaction({
          type: bill.type,
          amount: bill.amount,
          category: bill.category,
          note: `Recurring: ${bill.name} (Auto-logged)`,
          date,
          accountId: bill.accountId,
        });

        // 2. Advance the due date by at least one cycle, catching up if it was overdue
        const anchorDay =
          bill.anchorDay ?? parseLocalDate(bill.nextDueDate).getDate();
        let nextDate = nextRecurrenceDate(
          bill.nextDueDate,
          bill.frequency,
          anchorDay,
        );
        let skipped = 0;
        while (nextDate <= today && skipped < 120) {
          nextDate = nextRecurrenceDate(nextDate, bill.frequency, anchorDay);
          skipped++;
        }
        set((s) => ({
          recurring: s.recurring.map((r) =>
            r.id === id ? { ...r, nextDueDate: nextDate, anchorDay } : r,
          ),
        }));

        useToastStore.getState().addToast({
          type: "success",
          message:
            `${bill.type === "income" ? "Received" : "Paid"} "${bill.name}". Next due ${nextDate}` +
            (skipped > 0
              ? ` (skipped ${skipped} missed cycle${skipped > 1 ? "s" : ""})`
              : ""),
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
          const today = todayISO();
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

        const cur =
          get().accounts.find((a) => a.id === iou.accountId)?.currency ?? "EGP";
        useToastStore.getState().addToast({
          type: "success",
          message: `IOU record created for ${iou.personName} (${iou.amount.toLocaleString()} ${cur})`,
        });
      },

      updateIou: (id, updates) => {
        set((s) => ({
          ious: s.ious.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
      },

      deleteIou: (id, reverseTransactions = false) => {
        const linked = get().transactions.filter((t) => t.iouId === id);
        set((s) => ({
          ious: s.ious.filter((i) => i.id !== id),
        }));
        if (reverseTransactions) {
          for (const tx of linked) get().deleteTransaction(tx.id);
        }
      },

      settleIou: (id, targetAccountId) => {
        const iou = get().ious.find((i) => i.id === id);
        if (!iou || iou.status === "settled") return;

        const settleAccountId = targetAccountId || iou.accountId;
        const today = todayISO();
        const cur =
          get().accounts.find((a) => a.id === settleAccountId)?.currency ??
          "EGP";

        // Mark settled
        set((s) => ({
          ious: s.ious.map((i) =>
            i.id === id ? { ...i, status: "settled", settledDate: today } : i,
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
            message: `Settled! Received ${iou.amount.toLocaleString()} ${cur} back from ${iou.personName}`,
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
            message: `Settled! Repaid ${iou.amount.toLocaleString()} ${cur} to ${iou.personName}`,
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
        const { transactions, recurring, monthlyBudgetTarget, settings } =
          get();
        const now = new Date();
        const cycle = getFinancialCycle(now, settings.monthStartsOnDay || 1);
        const todayStr = todayISO();

        // 1. Cycle-to-date variable expenses (excluding transfers & lent IOUs)
        const monthToDateExpenses = transactions
          .filter(
            (tx) =>
              tx.type === "expense" &&
              cycle.isDateInCycle(tx.date) &&
              !tx.isIou,
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        // 2. Cycle-to-date income
        const monthToDateIncome = transactions
          .filter(
            (tx) =>
              tx.type === "income" && cycle.isDateInCycle(tx.date) && !tx.isIou,
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        // 3. Fixed Upcoming Bills due between today and end of current cycle
        const fixedUpcomingBills = recurring
          .filter(
            (r) =>
              r.type === "expense" &&
              r.status !== "paused" &&
              r.nextDueDate >= todayStr &&
              r.nextDueDate <= cycle.endDate,
          )
          .reduce((sum, r) => sum + r.amount, 0);

        // Formula: (Monthly Target Budget OR Income - Fixed Upcoming Bills - Cycle Variable Expenses) / Remaining Days
        const monthlyBase =
          monthlyBudgetTarget > 0 ? monthlyBudgetTarget : monthToDateIncome;
        const totalRemaining =
          monthlyBase - fixedUpcomingBills - monthToDateExpenses;
        const dailyAllowance = Math.round(totalRemaining / cycle.remainingDays);

        // Status classification
        let status: "safe" | "caution" | "overpace" = "safe";
        const benchmarkDaily =
          monthlyBase > 0 ? monthlyBase / cycle.totalDays : 0;

        if (totalRemaining <= 0 || dailyAllowance <= 0) {
          status = "overpace";
        } else if (
          benchmarkDaily > 0 &&
          dailyAllowance < benchmarkDaily * 0.75
        ) {
          status = "caution";
        }

        return {
          dailyAllowance: Math.max(0, dailyAllowance),
          totalRemaining,
          remainingDays: cycle.remainingDays,
          daysInMonth: cycle.totalDays,
          currentDay: cycle.currentDayInCycle,
          status,
          monthlyBase,
          fixedUpcomingBills,
          monthToDateExpenses,
          cycleLabel: cycle.cycleLabel,
          cycleStartDate: cycle.startDate,
          cycleEndDate: cycle.endDate,
          monthStartsOnDay: cycle.startDay,
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
        const { lastBackupDate, transactionsSinceLastBackup, transactions } =
          get();
        if (transactions.length === 0) return false;
        if (transactionsSinceLastBackup >= 15) return true;
        if (!lastBackupDate) return transactions.length >= 5;

        const daysSinceBackup =
          (Date.now() - new Date(lastBackupDate).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysSinceBackup >= 7 && transactionsSinceLastBackup > 0;
      },

      // Net Worth Breakdown
      getNetWorthBreakdown: () => {
        const { accounts, budgets, ious, exchangeRates } = get();

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

          const baseBalance = accountBalanceInBase(acc, exchangeRates);
          if (isHardAsset) {
            hardAssets += baseBalance;
          } else {
            liquidCash += baseBalance;
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
        const thirtyDaysAgo = addDaysISO(-30);

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
          recurring: data.recurring ?? [],
          ious: data.ious ?? [],
          exchangeRates: {
            ...DEFAULT_EXCHANGE_RATES,
            ...(data.exchangeRates ?? {}),
          },
          settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
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
          monthlyBudgetTarget: 0,
          lastBackupDate: null,
          transactionsSinceLastBackup: 0,
        });
      },

      processRecurringTransactions: () => {
        const today = todayISO();
        const templates = get().transactions.filter(
          (tx) => tx.isRecurring && tx.recurrenceFrequency,
        );

        for (const template of templates) {
          const anchorDay = parseLocalDate(template.date).getDate();

          // Catch up on every missed occurrence, not just the next one
          for (let guard = 0; guard < 400; guard++) {
            const generated = get()
              .transactions.filter((t) => t.parentRecurringId === template.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            const lastDate =
              generated.length > 0 ? generated[0].date : template.date;
            const nextDate = nextRecurrenceDate(
              lastDate,
              template.recurrenceFrequency!,
              anchorDay,
            );

            if (nextDate > today) break;
            if (
              template.recurrenceEndDate &&
              nextDate > template.recurrenceEndDate
            )
              break;

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
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState;
        }
        const state = persistedState as Record<string, unknown>;
        const migrated: Record<string, unknown> = {
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
        // v2 → v3: migrate date format default (was never applied) + hardcode currency
        if (version < 3) {
          const settings = (migrated.settings as Record<string, unknown>) ?? {};
          migrated.settings = {
            ...DEFAULT_SETTINGS,
            ...settings,
            dateFormat: "MMM D, YYYY",
            defaultCurrency: "EGP",
          };
        }
        return migrated;
      },
    },
  ),
);

// Initialize date format preference on load and sync with store changes
setDateFormatPreference(useStore.getState().settings?.dateFormat || "MMM D, YYYY");
useStore.subscribe((state, prevState) => {
  if (state.settings?.dateFormat !== prevState.settings?.dateFormat) {
    setDateFormatPreference(state.settings.dateFormat);
  }
});
