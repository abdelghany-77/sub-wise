import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowRight,
  ReceiptText,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, formatDate, cn } from "../../lib/utils";
import { CATEGORY_COLORS } from "../../types";
import type { Transaction } from "../../types";

interface RecentTransactionsProps {
  onViewAll: () => void;
}

export function RecentTransactions({ onViewAll }: RecentTransactionsProps) {
  const { transactions, getAccountById, privacyMode } = useStore();

  // Latest 5 transactions
  const recent = transactions.slice(0, 5);

  const TypeIcon = ({ type }: { type: Transaction["type"] }) => {
    if (type === "income")
      return <ArrowDownLeft size={14} className="text-emerald-400" />;
    if (type === "expense")
      return <ArrowUpRight size={14} className="text-rose-400" />;
    return <ArrowLeftRight size={14} className="text-sky-400" />;
  };

  return (
    <div className="space-y-3">
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title text-base sm:text-lg">Recent Transactions</h3>
          <p className="text-xs text-white/40 mt-0.5">Latest activity across all accounts</p>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1.5 px-3 rounded-xl hover:bg-blue-500/10 border border-blue-500/20"
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* List */}
      {recent.length === 0 ? (
        <Card className="text-center py-12">
          <ReceiptText size={32} className="mx-auto text-white/20 mb-2" />
          <p className="text-white/40 text-sm">No transactions yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((tx) => {
            const fromAcc = getAccountById(tx.accountId);
            const toAcc = tx.toAccountId ? getAccountById(tx.toAccountId) : undefined;
            const catColor = CATEGORY_COLORS[tx.category] ?? "#94a3b8";

            const borderTypeClass =
              tx.type === "income"
                ? "border-l-emerald-500"
                : tx.type === "expense"
                  ? "border-l-rose-500"
                  : "border-l-sky-500";

            return (
              <div
                key={tx.id}
                onClick={onViewAll}
                className={cn(
                  "glass-card-hover cursor-pointer group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border-l-[3px] transition-all duration-200",
                  borderTypeClass,
                )}
              >
                {/* Left: Type/Category Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${catColor}20` }}
                >
                  <TypeIcon type={tx.type} />
                </div>

                {/* Center: Title & details */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">
                      {tx.note || tx.category}
                    </p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: `${catColor}20`,
                        color: catColor,
                      }}
                    >
                      {tx.category}
                    </span>
                  </div>

                  <p className="text-xs text-white/40 truncate">
                    <span className="text-white/60">{fromAcc?.name}</span>
                    {toAcc && <span className="text-sky-400/80"> → {toAcc.name}</span>}
                    {" · "}
                    <span className="font-mono text-white/40">{formatDate(tx.date)}</span>
                  </p>
                </div>

                {/* Right: Amount */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={cn(
                      "text-sm sm:text-base font-bold font-mono transition-all duration-300",
                      tx.type === "income" && "text-emerald-400",
                      tx.type === "expense" && "text-rose-400",
                      tx.type === "transfer" && "text-sky-400",
                      privacyMode && "privacy-blur",
                    )}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatCurrency(tx.amount, fromAcc?.currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
