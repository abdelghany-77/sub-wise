export type AccountType = "bank" | "wallet" | "card" | "savings" | "investment";
export type TransactionType = "income" | "expense" | "transfer";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank Account",
  wallet: "Digital Wallet",
  card: "Credit Card",
  savings: "Savings",
  investment: "Investment",
};

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Housing & Rent",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Education",
  "Travel",
  "Personal Care",
  "Insurance",
  "Subscriptions",
  "Sadaqah",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment Returns",
  "Rental Income",
  "Gift",
  "Refund",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  bank: "#7c3aed",
  wallet: "#0ea5e9",
  card: "#f59e0b",
  savings: "#10b981",
  investment: "#ec4899",
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f97316",
  Shopping: "#8b5cf6",
  Transportation: "#3b82f6",
  "Housing & Rent": "#ef4444",
  Utilities: "#eab308",
  Healthcare: "#10b981",
  Entertainment: "#ec4899",
  Education: "#06b6d4",
  Travel: "#14b8a6",
  "Personal Care": "#a855f7",
  Insurance: "#6b7280",
  Subscriptions: "#f43f5e",
  Other: "#94a3b8",
  Salary: "#10b981",
  Freelance: "#22d3ee",
  Business: "#818cf8",
  "Investment Returns": "#f59e0b",
  "Rental Income": "#84cc16",
  Gift: "#fb7185",
  Refund: "#34d399",
};

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  accountId: string;
  toAccountId?: string; // for transfers
  createdAt: string;
}
