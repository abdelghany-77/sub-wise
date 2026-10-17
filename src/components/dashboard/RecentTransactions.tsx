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

  // Strictly top 5 transactions
  const recent = transactions.slice(0, 5);

  const TypeIcon = ({ type }: { type: Transaction["type"] }) => {
    if (type === "income")
      return <ArrowDownLeft size={13} className="text-emerald-400" />;
    if (type === "expense")
      return <ArrowUpRight size={13} className="text-rose-400" />;
    return <ArrowLeftRight size={13} className="text-sky-400" />;
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          <p className="text-[11px] text-white/40">Latest 5 ledger movements</p>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1 px-2.5 rounded-lg hover:bg-blue-500/10"
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 mt-2">
        {recent.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <ReceiptText size={28} className="text-white/20 mb-2" />
            <p className="text-xs text-white/40">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recent.map((tx) => {
              const fromAcc = getAccountById(tx.accountId);
              const toAcc = tx.toAccountId ? getAccountById(tx.toAccountId) : undefined;
              const catColor = CATEGORY_COLORS[tx.category] ?? "#94a3b8";

              return (
                <div
                  key={tx.id}
                  onClick={onViewAll}
                  className="cursor-pointer group flex items-center justify-between gap-3 py-2 px-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150"
                >
                  {/* Left: Icon & Title/Account */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${catColor}15` }}
                    >
                      <TypeIcon type={tx.type} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[220px]">
                        {tx.note || tx.category}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                        <span className="truncate max-w-[90px]">{fromAcc?.name || "Account"}</span>
                        {toAcc && <span className="text-sky-400">→ {toAcc.name}</span>}
                        <span>•</span>
                        <span className="font-mono text-white/50">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-bold font-mono tabular-nums whitespace-nowrap",
                        tx.type === "income" && "text-emerald-400",
                        tx.type === "expense" && "text-rose-400",
                        tx.type === "transfer" && "text-sky-400",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatCurrency(tx.amount, fromAcc?.currency || "EGP")}
                    </p>
                    <span
                      className="text-[9px] font-medium block uppercase tracking-wider"
                      style={{ color: catColor }}
                    >
                      {tx.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
