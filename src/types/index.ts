export type AccountType = "bank" | "wallet" | "card" | "savings" | "investment";
export type TransactionType = "income" | "expense" | "transfer";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank Account",
  wallet: "Digital Wallet",
  card: "Credit Card",
  savings: "Savings",
  investment: "Investment",
};

export type AssetType = "standard" | "foreign_currency" | "gold_24k" | "gold_21k";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  standard: "Standard (EGP)",
  foreign_currency: "Foreign Currency (USD, EUR, SAR)",
  gold_24k: "Gold 24K (Grams)",
  gold_21k: "Gold 21K (Grams)",
};

export type CardBrandTheme =
  | "cib"
  | "vodafone_cash"
  | "nbe"
  | "instapay"
  | "banque_misr"
  | "gold"
  | "emerald"
  | "royal_blue"
  | "crimson"
  | "slate";

export interface CardThemeConfig {
  id: CardBrandTheme;
  name: string;
  gradient: string;
  glow: string;
  chipColor: string;
  textColor: string;
  accentColor: string;
}

export const CARD_THEMES: Record<CardBrandTheme, CardThemeConfig> = {
  cib: {
    id: "cib",
    name: "CIB Royal",
    gradient: "from-[#0F2042] via-[#163366] to-[#0A162C]",
    glow: "rgba(22, 51, 102, 0.4)",
    chipColor: "#F59E0B",
    textColor: "#FFFFFF",
    accentColor: "#38BDF8",
  },
  vodafone_cash: {
    id: "vodafone_cash",
    name: "Vodafone Cash",
    gradient: "from-[#7F1D1D] via-[#B91C1C] to-[#450A0A]",
    glow: "rgba(185, 28, 28, 0.4)",
    chipColor: "#FDE047",
    textColor: "#FFFFFF",
    accentColor: "#FCA5A5",
  },
  nbe: {
    id: "nbe",
    name: "NBE Emerald",
    gradient: "from-[#064E3B] via-[#047857] to-[#022C22]",
    glow: "rgba(4, 120, 87, 0.4)",
    chipColor: "#FBBF24",
    textColor: "#FFFFFF",
    accentColor: "#6EE7B7",
  },
  instapay: {
    id: "instapay",
    name: "InstaPay Purple",
    gradient: "from-[#3B0764] via-[#6B21A8] to-[#1E1B4B]",
    glow: "rgba(107, 33, 168, 0.4)",
    chipColor: "#38BDF8",
    textColor: "#FFFFFF",
    accentColor: "#C084FC",
  },
  banque_misr: {
    id: "banque_misr",
    name: "Banque Misr",
    gradient: "from-[#1E3A5F] via-[#2D5484] to-[#122238]",
    glow: "rgba(45, 84, 132, 0.4)",
    chipColor: "#EAB308",
    textColor: "#FFFFFF",
    accentColor: "#FCD34D",
  },
  gold: {
    id: "gold",
    name: "Gold Bullion",
    gradient: "from-[#78350F] via-[#B45309] to-[#451A03]",
    glow: "rgba(180, 83, 9, 0.4)",
    chipColor: "#FEF08A",
    textColor: "#FEF9C3",
    accentColor: "#FDE047",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Green",
    gradient: "from-[#064E3B] via-[#059669] to-[#022C22]",
    glow: "rgba(5, 150, 105, 0.4)",
    chipColor: "#F59E0B",
    textColor: "#FFFFFF",
    accentColor: "#34D399",
  },
  royal_blue: {
    id: "royal_blue",
    name: "Royal Navy",
    gradient: "from-[#1E3A8A] via-[#2563EB] to-[#0F172A]",
    glow: "rgba(37, 99, 235, 0.4)",
    chipColor: "#FBBF24",
    textColor: "#FFFFFF",
    accentColor: "#60A5FA",
  },
  crimson: {
    id: "crimson",
    name: "Crimson Red",
    gradient: "from-[#881337] via-[#BE123C] to-[#4C0519]",
    glow: "rgba(190, 18, 60, 0.4)",
    chipColor: "#FCD34D",
    textColor: "#FFFFFF",
    accentColor: "#FB7185",
  },
  slate: {
    id: "slate",
    name: "Titanium Slate",
    gradient: "from-[#1E293B] via-[#334155] to-[#0F172A]",
    glow: "rgba(51, 65, 85, 0.4)",
    chipColor: "#E2E8F0",
    textColor: "#F8FAFC",
    accentColor: "#94A3B8",
  },
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
  Sadaqah: "#059669",
  Transfer: "#0ea5e9",
  Adjustment: "#a855f7",
  "Balance Reconciliation / تسوية رصيد": "#8b5cf6",
  "Lent / دين مستحق": "#f59e0b",
  "Settlement / سداد دين": "#10b981",
};

export const PRESET_COLORS = [
  "#3b82f6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // In EGP (base) or total calculated value
  currency: string;
  color: string;
  createdAt: string;
  
  // Fintech Personal CFO extensions:
  assetType?: AssetType;
  unitBalance?: number; // e.g. 500 for $500, or 10 for 10 grams Gold
  exchangeRateToBase?: number; // e.g. 50 for USD, 4200 for 24K Gold
  brandTheme?: CardBrandTheme;
  accountNumberMasked?: string; // e.g. "•••• 8921"
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
  // Recurring transaction fields
  isRecurring?: boolean;
  recurrenceFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEndDate?: string;
  parentRecurringId?: string; // links generated transactions to the template
  
  // Next-Gen flags
  isReconciliation?: boolean;
  isIou?: boolean;
  iouId?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  currency: string;
  createdAt: string;
  deductFromNetWorth?: boolean;
  accountId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: string;
  accountId?: string; // linked savings account
  color: string;
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "yearly";
  nextDueDate: string; // YYYY-MM-DD
  accountId: string;
  type: "income" | "expense";
  category: string;
  icon?: string;
  createdAt: string;
}

export type IouType = "lent" | "borrowed";
export type IouStatus = "pending" | "settled";

export interface Iou {
  id: string;
  personName: string;
  amount: number;
  type: IouType; // "lent" = owed to user (ليا بره) | "borrowed" = user owes (عليا)
  accountId: string;
  dueDate?: string;
  note?: string;
  status: IouStatus;
  settledDate?: string;
  createdAt: string;
}

export interface ExchangeRates {
  USD: number;
  EUR: number;
  SAR: number;
  GOLD_24K: number;
  GOLD_21K: number;
  [key: string]: number;
}

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 50.0,
  EUR: 54.0,
  SAR: 13.3,
  GOLD_24K: 4200,
  GOLD_21K: 3675,
};

export interface SafeToSpendResult {
  dailyAllowance: number;
  totalRemaining: number;
  remainingDays: number;
  daysInMonth: number;
  currentDay: number;
  status: "safe" | "caution" | "overpace";
  monthlyBase: number;
  fixedUpcomingBills: number;
  monthToDateExpenses: number;
}

export interface NetWorthBreakdown {
  liquidCash: number;
  hardAssets: number;
  receivables: number;
  payables: number;
  committedBudgets: number;
  totalNetWorth: number;
}
