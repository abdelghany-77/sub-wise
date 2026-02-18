import { useState, useMemo } from "react";
import {
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, formatDate } from "../../lib/utils";
import type { Transaction } from "../../types";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_COLORS,
} from "../../types";
import { cn } from "../../lib/utils";

const ALL_CATEGORIES = [
  "All",
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  "Transfer",
];

export function TransactionHistory() {
  const { transactions, accounts, deleteTransaction, getAccountById } =
    useStore();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState<
    "all" | "income" | "expense" | "transfer"
  >("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterCategory !== "All") {
        if (filterCategory === "Transfer" && tx.type !== "transfer")
          return false;
        if (filterCategory !== "Transfer" && tx.category !== filterCategory)
          return false;
      }
      if (filterAccount !== "all" && tx.accountId !== filterAccount)
        return false;
      if (search) {
        const q = search.toLowerCase();
        const acc = getAccountById(tx.accountId);
        return (
          tx.note.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          acc?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    transactions,
    filterType,
    filterCategory,
    filterAccount,
    search,
    getAccountById,
  ]);

  const TypeIcon = ({ type }: { type: Transaction["type"] }) => {
    if (type === "income")
      return <ArrowDownLeft size={14} className="text-emerald-400" />;
    if (type === "expense")
      return <ArrowUpRight size={14} className="text-rose-400" />;
    return <ArrowLeftRight size={14} className="text-sky-400" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Transaction History</h2>
        <span className="text-sm text-white/40">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <Card padding="sm" className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            className="input-base pl-10 text-sm"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Row */}
        <div className="flex gap-2 flex-wrap">
          {/* Type Tabs */}
          <div className="flex bg-white/[0.04] rounded-lg p-1 gap-0.5 sm:gap-1 flex-wrap">
            {(["all", "income", "expense", "transfer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-2 sm:px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-200",
                  filterType === t
                    ? "bg-blue-500 text-white"
                    : "text-white/50 hover:text-white",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Account Filter */}
          <select
            className="input-base text-xs py-1.5 flex-1 min-w-[120px] [&>option]:bg-[#131320]"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="input-base text-xs py-1.5 flex-1 min-w-[120px] [&>option]:bg-[#131320]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <Filter size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            No transactions match your filters
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const fromAcc = getAccountById(tx.accountId);
            const toAcc = tx.toAccountId
              ? getAccountById(tx.toAccountId)
              : undefined;
            const catColor = CATEGORY_COLORS[tx.category] ?? "#94a3b8";

            return (
              <div
                key={tx.id}
                className="glass-card-hover group flex items-center gap-3 sm:gap-4 p-3 sm:p-4"
              >
                {/* Category dot + icon */}
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${catColor}20` }}
                >
                  <TypeIcon type={tx.type} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
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
                  <p className="text-xs text-white/40 mt-0.5">
                    {fromAcc?.name}
                    {toAcc && (
                      <span className="text-sky-400/70"> → {toAcc.name}</span>
                    )}
                    {" · "}
                    {formatDate(tx.date)}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={cn(
                      "text-sm font-bold font-mono",
                      tx.type === "income" && "text-emerald-400",
                      tx.type === "expense" && "text-rose-400",
                      tx.type === "transfer" && "text-sky-400",
                    )}
                  >
                    {tx.type === "income"
                      ? "+"
                      : tx.type === "expense"
                        ? "-"
                        : ""}
                    {formatCurrency(tx.amount, fromAcc?.currency)}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-[#131320] border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Transaction?
            </h3>
            <p className="text-white/50 text-sm mb-6">
              This will reverse the balance effect on the associated account(s).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTransaction(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="btn-danger flex-1 justify-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
