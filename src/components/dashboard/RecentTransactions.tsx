import { useMemo, useState } from "react";
import { ArrowRight, ReceiptText, Repeat } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, formatDayLabel, cn } from "../../lib/utils";
import type { Transaction } from "../../types";
import { TransactionDetailModal } from "../transactions/TransactionDetailModal";
import {
  TX_TYPE_META,
  getCategoryColor,
  getCategoryIcon,
} from "../transactions/transactionMeta";

interface RecentTransactionsProps {
  onViewAll: () => void;
  limit?: number;
  className?: string;
}

export function RecentTransactions({
  onViewAll,
  limit = 5,
  className,
}: RecentTransactionsProps) {
  const { transactions, getAccountById, privacyMode } = useStore();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const recent = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            b.createdAt.localeCompare(a.createdAt),
        )
        .slice(0, limit),
    [transactions, limit],
  );

  return (
    <Card
      padding="sm"
      className={cn("flex flex-col h-full relative overflow-hidden", className)}
    >
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          <p className="text-[11px] text-white/40">
            Tap a row for full details
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1 px-2.5 rounded-lg hover:bg-blue-500/10"
        >
          <span>View all</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="flex-1 min-h-0 mt-1.5">
        {recent.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <ReceiptText size={28} className="text-white/20 mb-2" />
            <p className="text-xs text-white/40">
              No transactions recorded yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {recent.map((tx) => {
              const fromAcc = getAccountById(tx.accountId);
              const toAcc = tx.toAccountId
                ? getAccountById(tx.toAccountId)
                : undefined;
              const meta = TX_TYPE_META[tx.type];
              const catColor = getCategoryColor(tx);
              const Icon = getCategoryIcon(tx.category, tx.type);

              return (
                <li key={tx.id}>
                  <button
                    onClick={() => setSelectedTx(tx)}
                    className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-xl text-left hover:bg-white/[0.05] focus-visible:bg-white/[0.06] focus:outline-none transition-colors"
                    aria-label={`View details for ${tx.note || tx.category}`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{
                        backgroundColor: `${catColor}1f`,
                        color: catColor,
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white truncate">
                          {tx.note || tx.category}
                        </p>
                        {tx.isRecurring && (
                          <Repeat
                            size={10}
                            className="text-blue-400 flex-shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 truncate">
                        {fromAcc?.name || "Account"}
                        {toAcc && (
                          <span className="text-sky-400"> → {toAcc.name}</span>
                        )}
                        <span className="mx-1 text-white/20">•</span>
                        {formatDayLabel(tx.date)}
                      </p>
                    </div>

                    <p
                      className={cn(
                        "text-xs sm:text-[13px] font-bold font-mono tabular-nums whitespace-nowrap",
                        meta.text,
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {meta.sign}
                      {formatCurrency(tx.amount, fromAcc?.currency || "EGP")}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </Card>
  );
}
