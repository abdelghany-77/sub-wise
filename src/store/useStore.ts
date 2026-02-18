import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Account, Transaction } from "../types";
import { generateId } from "../lib/utils";
import { ACCOUNT_TYPE_COLORS } from "../types";

interface WealthState {
  accounts: Account[];
  transactions: Transaction[];
  privacyMode: boolean;
  // Actions
  addAccount: (account: Omit<Account, "id" | "createdAt">) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  deleteTransaction: (id: string) => void;
  importData: (data: {
    accounts: Account[];
    transactions: Transaction[];
  }) => void;
  clearAll: () => void;
  togglePrivacyMode: () => void;
  // Computed helpers (not persisted — derived on access)
  getNetWorth: () => number;
  getAccountById: (id: string) => Account | undefined;
}

// Seed demo data for first-time users
const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc-1",
    name: "CIB Bank",
    type: "bank",
    balance: 45000,
    currency: "EGP",
    color: ACCOUNT_TYPE_COLORS.bank,
    createdAt: new Date(Date.now() - 90 * 864e5).toISOString(),
  },
  {
    id: "acc-2",
    name: "Vodafone Cash",
    type: "wallet",
    balance: 3200,
    currency: "EGP",
    color: ACCOUNT_TYPE_COLORS.wallet,
    createdAt: new Date(Date.now() - 60 * 864e5).toISOString(),
  },
  {
    id: "acc-3",
    name: "Cash Wallet",
    type: "wallet",
    balance: 1500,
    currency: "EGP",
    color: "#f59e0b",
    createdAt: new Date(Date.now() - 60 * 864e5).toISOString(),
  },
  {
    id: "acc-4",
    name: "Savings Goal",
    type: "savings",
    balance: 22000,
    currency: "EGP",
    color: ACCOUNT_TYPE_COLORS.savings,
    createdAt: new Date(Date.now() - 30 * 864e5).toISOString(),
  },
];

const generateDelta = (days: number) =>
  new Date(Date.now() - days * 864e5).toISOString().split("T")[0];

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    type: "income",
    amount: 15000,
    category: "Salary",
    note: "Monthly salary",
    date: generateDelta(25),
    accountId: "acc-1",
    createdAt: new Date(Date.now() - 25 * 864e5).toISOString(),
  },
  {
    id: "tx-2",
    type: "expense",
    amount: 2400,
    category: "Food & Dining",
    note: "Groceries & restaurants",
    date: generateDelta(22),
    accountId: "acc-1",
    createdAt: new Date(Date.now() - 22 * 864e5).toISOString(),
  },
  {
    id: "tx-3",
    type: "expense",
    amount: 1800,
    category: "Transportation",
    note: "Uber & fuel",
    date: generateDelta(20),
    accountId: "acc-2",
    createdAt: new Date(Date.now() - 20 * 864e5).toISOString(),
  },
  {
    id: "tx-4",
    type: "transfer",
    amount: 5000,
    category: "Transfer",
    note: "Monthly savings",
    date: generateDelta(18),
    accountId: "acc-1",
    toAccountId: "acc-4",
    createdAt: new Date(Date.now() - 18 * 864e5).toISOString(),
  },
  {
    id: "tx-5",
    type: "expense",
    amount: 980,
    category: "Subscriptions",
    note: "Netflix, Spotify, etc.",
    date: generateDelta(15),
    accountId: "acc-1",
    createdAt: new Date(Date.now() - 15 * 864e5).toISOString(),
  },
  {
    id: "tx-6",
    type: "expense",
    amount: 3200,
    category: "Shopping",
    note: "Clothes & electronics",
    date: generateDelta(12),
    accountId: "acc-1",
    createdAt: new Date(Date.now() - 12 * 864e5).toISOString(),
  },
  {
    id: "tx-7",
    type: "income",
    amount: 4500,
    category: "Freelance",
    note: "Design project",
    date: generateDelta(10),
    accountId: "acc-1",
    createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
  {
    id: "tx-8",
    type: "expense",
    amount: 600,
    category: "Entertainment",
    note: "Cinema & events",
    date: generateDelta(8),
    accountId: "acc-3",
    createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
  },
  {
    id: "tx-9",
    type: "expense",
    amount: 450,
    category: "Healthcare",
    note: "Doctor visit",
    date: generateDelta(6),
    accountId: "acc-1",
    createdAt: new Date(Date.now() - 6 * 864e5).toISOString(),
  },
  {
    id: "tx-10",
    type: "transfer",
    amount: 1200,
    category: "Transfer",
    note: "Top-up wallet",
    date: generateDelta(4),
    accountId: "acc-1",
    toAccountId: "acc-2",
    createdAt: new Date(Date.now() - 4 * 864e5).toISOString(),
  },
  {
    id: "tx-11",
    type: "expense",
    amount: 720,
    category: "Utilities",
    note: "Electricity & water",
    date: generateDelta(3),
    accountId: "acc-1",
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
  },
  {
    id: "tx-12",
    type: "income",
    amount: 800,
    category: "Investment Returns",
    note: "Dividends",
    date: generateDelta(1),
    accountId: "acc-4",
    createdAt: new Date(Date.now() - 1 * 864e5).toISOString(),
  },
];

export const useStore = create<WealthState>()(
  persist(
    (set, get) => ({
      accounts: DEMO_ACCOUNTS,
      transactions: DEMO_TRANSACTIONS,
      privacyMode: false,

      togglePrivacyMode: () => set((s) => ({ privacyMode: !s.privacyMode })),

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

      importData: (data) => {
        set({ accounts: data.accounts, transactions: data.transactions });
      },

      clearAll: () => {
        set({ accounts: [], transactions: [] });
      },

      getNetWorth: () => {
        return get().accounts.reduce((sum, acc) => sum + acc.balance, 0);
      },

      getAccountById: (id) => {
        return get().accounts.find((a) => a.id === id);
      },
    }),
    {
      name: "subwise-wealth-data",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
