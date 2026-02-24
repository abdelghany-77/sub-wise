import { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  Pencil,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import { AddTransactionModal } from "./AddTransactionModal";

const ALL_CATEGORIES = [
  "All",
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  "Transfer",
];

type SortField = "date" | "amount" | "category";
type SortDir = "asc" | "desc";

export function TransactionHistory() {
  const { transactions, accounts, deleteTransaction, getAccountById } =
    useStore();
  const { privacyMode } = useStore();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState<
    "all" | "income" | "expense" | "transfer"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = transactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterCategory !== "All") {
        if (filterCategory === "Transfer" && tx.type !== "transfer")
          return false;
        if (filterCategory !== "Transfer" && tx.category !== filterCategory)
          return false;
      }
      if (filterAccount !== "all" && tx.accountId !== filterAccount)
        return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
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

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "amount") cmp = a.amount - b.amount;
      else if (sortField === "category")
        cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    transactions,
    filterType,
    filterCategory,
    filterAccount,
    dateFrom,
    dateTo,
    search,
    sortField,
    sortDir,
    getAccountById,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterType,
    filterCategory,
    filterAccount,
    search,
    dateFrom,
    dateTo,
    sortField,
    sortDir,
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
            aria-label="Filter transactions by account"
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
            aria-label="Filter transactions by category"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range + Sort Row */}
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <Calendar size={14} className="text-white/30 flex-shrink-0" />
            <input
              type="date"
              className="input-base text-xs py-1.5 flex-1"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Filter from date"
              placeholder="From"
            />
            <span className="text-white/30 text-xs">–</span>
            <input
              type="date"
              className="input-base text-xs py-1.5 flex-1"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Filter to date"
              placeholder="To"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={14} className="text-white/30 flex-shrink-0" />
            <select
              className="input-base text-xs py-1.5 min-w-[100px] [&>option]:bg-[#131320]"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              aria-label="Sort transactions by"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs font-medium min-w-[44px] text-center"
              aria-label={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
            >
              {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>
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
          {paginated.map((tx) => {
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

                {/* Info + Amount wrapper */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  {/* Top row: note + category badge */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white break-words min-w-0">
                      {tx.note || tx.category}
                    </p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                      style={{
                        backgroundColor: `${catColor}20`,
                        color: catColor,
                      }}
                    >
                      {tx.category}
                    </span>
                  </div>

                  {/* Bottom row: account · date + amount */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs text-white/40 shrink-0">
                      {fromAcc?.name}
                      {toAcc && (
                        <span className="text-sky-400/70"> → {toAcc.name}</span>
                      )}
                      {" · "}
                      {formatDate(tx.date)}
                    </p>

                    {/* Amount visible on all screen sizes */}
                    <p
                      className={cn(
                        "text-sm font-bold font-mono transition-all duration-300 shrink-0",
                        tx.type === "income" && "text-emerald-400",
                        tx.type === "expense" && "text-rose-400",
                        tx.type === "transfer" && "text-sky-400",
                        privacyMode && "blur-md select-none",
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
                </div>

                {/* Edit + Delete */}
                <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                  <button
                    type="button"
                    aria-label="Edit transaction"
                    onClick={() => setEditingTx(tx)}
                    className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete transaction"
                    onClick={() => setConfirmDelete(tx.id)}
                    className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2">
          <p className="text-xs text-white/40">
            Showing {(safeCurrentPage - 1) * pageSize + 1}–
            {Math.min(safeCurrentPage * pageSize, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-white/60 px-2 font-medium">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:pointer-events-none"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
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

      {/* Edit Transaction Modal */}
      {editingTx && (
        <AddTransactionModal
          editTransaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
