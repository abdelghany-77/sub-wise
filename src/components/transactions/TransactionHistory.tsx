import { useState, useMemo, useEffect } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  Trash2,
  Pencil,
  Copy,
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
import { useToastStore } from "../../store/useToastStore";
import { Card } from "../ui/Card";
import { formatCurrency, formatDate, todayISO } from "../../lib/utils";
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
  const {
    transactions,
    accounts,
    deleteTransaction,
    addTransaction,
    getAccountById,
    privacyMode,
  } = useStore();
  const { addToast } = useToastStore();

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
  const [pageSize, setPageSize] = useState(10);

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
          acc?.name.toLowerCase().includes(q) ||
          String(tx.amount).includes(q)
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
    pageSize,
  ]);

  const handleDuplicate = (tx: Transaction) => {
    addTransaction({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      note: tx.note ? `${tx.note} (Copy)` : "Copy",
      date: todayISO(),
      accountId: tx.accountId,
      toAccountId: tx.toAccountId,
      isRecurring: false,
    });
    addToast({
      type: "success",
      message: `Duplicated transaction "${tx.note || tx.category}"`,
      duration: 3500,
    });
  };

  const TypeIcon = ({ type }: { type: Transaction["type"] }) => {
    if (type === "income")
      return <ArrowDownLeft size={15} className="text-emerald-400" />;
    if (type === "expense")
      return <ArrowUpRight size={15} className="text-rose-400" />;
    return <ArrowLeftRight size={15} className="text-sky-400" />;
  };

  const startResult = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endResult = Math.min(safeCurrentPage * pageSize, filtered.length);

  return (
    <div className="space-y-4 sm:space-y-5 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Transaction History</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Manage, filter, and review all account movements
          </p>
        </div>
        <span className="text-xs font-mono bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-full text-white/60">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filter Toolbar */}
      <Card padding="sm" className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            className="input-base pl-10 text-sm"
            placeholder="Search by note, category, account, or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Row */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Type Tabs */}
          <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 gap-1 flex-wrap">
            {(["all", "income", "expense", "transfer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all duration-200 min-h-[32px]",
                  filterType === t
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Account Filter */}
          <select
            className="input-base text-xs py-2 flex-1 min-w-[130px] min-h-[38px] [&>option]:bg-[#111827]"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            aria-label="Filter transactions by account"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="input-base text-xs py-2 flex-1 min-w-[130px] min-h-[38px] [&>option]:bg-[#111827]"
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
          <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
            <Calendar size={14} className="text-white/30 flex-shrink-0" />
            <input
              type="date"
              className="input-base text-xs py-1.5 flex-1 min-h-[38px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Filter from date"
              placeholder="From"
            />
            <span className="text-white/30 text-xs">–</span>
            <input
              type="date"
              className="input-base text-xs py-1.5 flex-1 min-h-[38px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Filter to date"
              placeholder="To"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={14} className="text-white/30 flex-shrink-0" />
            <select
              className="input-base text-xs py-1.5 min-w-[100px] min-h-[38px] [&>option]:bg-[#111827]"
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
              className="px-3 py-2 rounded-xl text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-xs font-medium min-h-[38px] text-center"
              aria-label={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
            >
              {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>
        </div>
      </Card>

      {/* Transaction Table / List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <Filter size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            No transactions match your current filters
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

            const borderTypeClass =
              tx.type === "income"
                ? "border-l-emerald-500"
                : tx.type === "expense"
                  ? "border-l-rose-500"
                  : "border-l-sky-500";

            return (
              <div
                key={tx.id}
                className={cn(
                  "glass-card-hover group relative flex items-start gap-3 p-3 sm:p-4 rounded-xl border-l-[3px] transition-all duration-200",
                  borderTypeClass,
                )}
              >
                {/* Category Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm mt-0.5"
                  style={{ backgroundColor: `${catColor}20` }}
                >
                  <TypeIcon type={tx.type} />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Top Row: Title + Category badge + Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate max-w-[180px] xs:max-w-[260px] sm:max-w-none">
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
                      {tx.isRecurring && (
                        <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 whitespace-nowrap">
                          {tx.recurrenceFrequency || "Recurring"}
                        </span>
                      )}
                    </div>

                    {/* Amount */}
                    <p
                      className={cn(
                        "text-sm sm:text-base font-bold font-mono whitespace-nowrap flex-shrink-0 text-right ml-1",
                        tx.type === "income" && "text-emerald-400",
                        tx.type === "expense" && "text-rose-400",
                        tx.type === "transfer" && "text-sky-400",
                        privacyMode && "privacy-blur",
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

                  {/* Bottom Row: Account Details + Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <p className="text-xs text-white/40 truncate min-w-0 flex-1">
                      <span className="text-white/70 font-medium">{fromAcc?.name}</span>
                      {toAcc && (
                        <span className="text-sky-400/90 font-medium"> → {toAcc.name}</span>
                      )}
                      <span className="mx-1.5 text-white/20">•</span>
                      <span className="font-mono text-white/50">
                        {formatDate(tx.date)}
                      </span>
                    </p>

                    {/* Inline Hover Action Buttons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label="Duplicate transaction"
                        title="Duplicate transaction"
                        onClick={() => handleDuplicate(tx)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label="Edit transaction"
                        title="Edit transaction"
                        onClick={() => setEditingTx(tx)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete transaction"
                        title="Delete transaction"
                        onClick={() => setConfirmDelete(tx.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Redesigned Table Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
        {/* Left side: Range info + page-size selector */}
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <p className="text-xs text-white/50 font-mono">
            Showing{" "}
            <span className="text-white font-medium">
              {startResult}–{endResult}
            </span>{" "}
            of <span className="text-white font-medium">{filtered.length}</span>{" "}
            results
          </p>

          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#111827] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Right side: Pill buttons for <<, <, Page X of Y, >, >> */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111827] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:pointer-events-none"
            aria-label="First page"
            title="First page"
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111827] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:pointer-events-none"
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="px-3 py-1 rounded-lg bg-[#111827] border border-white/[0.08] text-xs font-mono text-white/80 min-w-[84px] text-center">
            <span className="text-white font-semibold">{safeCurrentPage}</span>
            <span className="text-white/30 mx-1">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111827] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:pointer-events-none"
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111827] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:pointer-events-none"
            aria-label="Last page"
            title="Last page"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteTransaction(confirmDelete);
        }}
        title="Delete Transaction?"
        message="This will reverse the balance effect on the associated account(s)."
      />

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
