import {
  ArrowLeftRight,
  Briefcase,
  Building2,
  Car,
  CircleDollarSign,
  Clapperboard,
  Gift,
  GraduationCap,
  HandCoins,
  HandHeart,
  HeartPulse,
  Home,
  Laptop,
  Plane,
  Repeat,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Undo2,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_COLORS, type Transaction, type TransactionType } from "../../types";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Food & Dining": Utensils,
  Shopping: ShoppingBag,
  Transportation: Car,
  "Housing & Rent": Home,
  Utilities: Zap,
  Healthcare: HeartPulse,
  Entertainment: Clapperboard,
  Education: GraduationCap,
  Travel: Plane,
  "Personal Care": Sparkles,
  Insurance: ShieldCheck,
  Subscriptions: Repeat,
  Sadaqah: HandHeart,
  Salary: Briefcase,
  Freelance: Laptop,
  Business: Building2,
  "Investment Returns": TrendingUp,
  "Rental Income": Home,
  Gift: Gift,
  Refund: Undo2,
  Transfer: ArrowLeftRight,
  Adjustment: Scale,
  "Balance Reconciliation / تسوية رصيد": Scale,
  "Lent / دين مستحق": HandCoins,
  "Settlement / سداد دين": HandCoins,
};

export function getCategoryIcon(category: string, type: TransactionType): LucideIcon {
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  if (type === "transfer") return ArrowLeftRight;
  return type === "income" ? Wallet : CircleDollarSign;
}

export function getCategoryColor(tx: Pick<Transaction, "category" | "type">): string {
  if (tx.type === "transfer") return CATEGORY_COLORS.Transfer;
  return CATEGORY_COLORS[tx.category] ?? "#94a3b8";
}

export interface TxTypeMeta {
  label: string;
  sign: "+" | "-" | "";
  text: string;
  softBg: string;
  border: string;
  /** Tailwind gradient used to tint the detail popup hero. */
  heroGradient: string;
  hex: string;
}

export const TX_TYPE_META: Record<TransactionType, TxTypeMeta> = {
  income: {
    label: "Income",
    sign: "+",
    text: "text-emerald-400",
    softBg: "bg-emerald-500/15",
    border: "border-emerald-500/25",
    heroGradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    hex: "#34d399",
  },
  expense: {
    label: "Expense",
    sign: "-",
    text: "text-rose-400",
    softBg: "bg-rose-500/15",
    border: "border-rose-500/25",
    heroGradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    hex: "#fb7185",
  },
  transfer: {
    label: "Transfer",
    sign: "",
    text: "text-sky-400",
    softBg: "bg-sky-500/15",
    border: "border-sky-500/25",
    heroGradient: "from-sky-500/20 via-sky-500/5 to-transparent",
    hex: "#38bdf8",
  },
};
