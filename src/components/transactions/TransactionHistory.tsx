import { useState, useMemo, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  RotateCcw,
  ReceiptText,
  Repeat,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  X,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useToastStore } from "../../store/useToastStore";
import { cn, formatCurrency, formatDayLabel } from "../../lib/utils";
import type { Transaction } from "../../types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../types";
import { TransactionDetailModal } from "./TransactionDetailModal";
import {
  TX_TYPE_META,
  getCategoryColor,
  getCategoryIcon,
} from "./transactionMeta";

const ALL_CATEGORIES = [
  "All",
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  "Transfer",
];

type SortField = "date" | "amount" | "category";
type SortDir = "asc" | "desc";
type TypeFilter = "all" | "income" | "expense" | "transfer";

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expenses" },
  { id: "transfer", label: "Transfers" },
];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function TransactionHistory() {
  const { transactions, accounts, getAccountById, recordBackup, privacyMode } =
    useStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState<TypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = transactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterCategory !== "All") {
        if (filterCategory === "Transfer" && tx.type !== "transfer")
          return false;
        if (filterCategory !== "Transfer" && tx.category !== filterCategory)
          return false;
      }
      if (
        filterAccount !== "all" &&
        tx.accountId !== filterAccount &&
        tx.toAccountId !== filterAccount
      )
        return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      if (q) {
        const acc = getAccountById(tx.accountId);
        return (
          tx.note.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          !!acc?.name.toLowerCase().includes(q) ||
          String(tx.amount).includes(q)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date")
        cmp =
          a.date.localeCompare(b.date) ||
          a.createdAt.localeCompare(b.createdAt);
      else if (sortField === "amount") cmp = a.amount - b.amount;
      else cmp = a.category.localeCompare(b.category);
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

  // Summary of the filtered set (transfers are neutral to net worth)
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  // Group the visible page by day when sorted by date
  const groups = useMemo(() => {
    if (sortField !== "date") {
      return [{ key: "all", label: "", items: paginated, net: 0 }];
    }
    const map = new Map<string, Transaction[]>();
    for (const tx of paginated) {
      const list = map.get(tx.date) ?? [];
      list.push(tx);
      map.set(tx.date, list);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      key: date,
      label: formatDayLabel(date),
      items,
      net: items.reduce(
        (s, t) =>
          t.type === "income"
            ? s + t.amount
            : t.type === "expense"
              ? s - t.amount
              : s,
        0,
      ),
    }));
  }, [paginated, sortField]);

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

  const activeFilterCount =
    (filterCategory !== "All" ? 1 : 0) +
    (filterAccount !== "all" ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (sortField !== "date" || sortDir !== "desc" ? 1 : 0);
  const hasAnyFilter =
    activeFilterCount > 0 || filterType !== "all" || !!search;

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("All");
    setFilterAccount("all");
    setFilterType("all");
    setDateFrom("");
    setDateTo("");
    setSortField("date");
    setSortDir("desc");
  };

  const applyPreset = (preset: "month" | "30d" | "all") => {
    const now = new Date();
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    } else if (preset === "month") {
      setDateFrom(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
      setDateTo(toISO(now));
    } else {
      setDateFrom(toISO(new Date(now.getTime() - 30 * 864e5)));
      setDateTo(toISO(now));
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      addToast({ type: "warning", message: "No transactions to export" });
      return;
    }
    const headers = [
      "ID",
      "Date",
      "Type",
      "Amount",
      "Currency",
      "Category",
      "Account",
      "ToAccount",
      "Note",
      "IsRecurring",
    ];
    const rows = filtered.map((tx) => {
      const fromAcc = getAccountById(tx.accountId);
      const toAcc = tx.toAccountId ? getAccountById(tx.toAccountId) : undefined;
      return [
        `"${tx.id}"`,
        `"${tx.date}"`,
        `"${tx.type}"`,
        tx.amount,
        `"${fromAcc?.currency || "EGP"}"`,
        `"${tx.category || ""}"`,
        `"${fromAcc?.name || ""}"`,
        `"${toAcc?.name || ""}"`,
        `"${(tx.note || "").replace(/"/g, '""')}"`,
        `"${tx.isRecurring ? "yes" : "no"}"`,
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `walleteer_transactions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    recordBackup();
    addToast({
      type: "success",
      message: `Exported ${filtered.length} transactions to CSV`,
    });
  };

  const startResult =
    filtered.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endResult = Math.min(safeCurrentPage * pageSize, filtered.length);

  const pagerBtn =
    "flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.09] transition-all disabled:opacity-20 disabled:pointer-events-none";

  return (
    <div className="space-y-3.5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          {
            label: "Income",
            value: summary.income,
            sign: "+",
            icon: <ArrowDownLeft size={14} />,
            tone: "text-emerald-400 bg-emerald-500/15",
            valueTone: "text-emerald-400",
          },
          {
            label: "Expenses",
            value: summary.expense,
            sign: "-",
            icon: <ArrowUpRight size={14} />,
            tone: "text-rose-400 bg-rose-500/15",
            valueTone: "text-rose-400",
          },
          {
            label: "Net",
            value: Math.abs(summary.net),
            sign: summary.net >= 0 ? "+" : "-",
            icon: <Scale size={14} />,
            tone: "text-blue-400 bg-blue-500/15",
            valueTone: summary.net >= 0 ? "text-white" : "text-rose-300",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-card px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 min-w-0"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl hidden xs:flex items-center justify-center flex-shrink-0",
                s.tone,
              )}
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
                {s.label}
              </p>
              <p
                className={cn(
                  "text-xs sm:text-base font-bold font-mono tabular-nums truncate",
                  s.valueTone,
                  privacyMode && "privacy-blur",
                )}
              >
                {s.sign}
                {formatCurrency(s.value, "EGP").replace("EGP ", "")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-2.5 sm:p-3 space-y-2.5">
        <div className="flex flex-col lg:flex-row gap-2.5 lg:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
            <input
              className="input-base pl-10 pr-9 text-sm py-2"
              placeholder="Search note, category, account or amount…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search transactions"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 lg:flex-none flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-0.5 gap-0.5">
              {TYPE_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilterType(t.id)}
                  className={cn(
                    "flex-1 lg:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filterType === t.id
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-white/50 hover:text-white hover:bg-white/[0.05]",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                showFilters || activeFilterCount > 0
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                  : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08]",
              )}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              title="Export filtered transactions to CSV"
              aria-label="Export CSV"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <Download size={14} />
              <span className="hidden md:inline">CSV</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2.5 border-t border-white/[0.06] animate-fade-in">
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                Account
              </span>
              <select
                className="input-base text-xs py-2 [&>option]:bg-[#111827]"
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
              >
                <option value="all">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                Category
              </span>
              <select
                className="input-base text-xs py-2 [&>option]:bg-[#111827]"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                Date range
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  className="input-base text-xs py-2 px-2"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="From date"
                />
                <span className="text-white/30 text-xs">–</span>
                <input
                  type="date"
                  className="input-base text-xs py-2 px-2"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="To date"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                Sort by
              </span>
              <div className="flex items-center gap-1.5">
                <select
                  className="input-base text-xs py-2 [&>option]:bg-[#111827]"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  aria-label="Sort transactions by"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                </select>
                <button
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  className="px-3 py-2 rounded-xl text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium whitespace-nowrap"
                  aria-label={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
                >
                  {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">
                Quick range
              </span>
              {(
                [
                  ["month", "This month"],
                  ["30d", "Last 30 days"],
                  ["all", "All time"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
              {hasAnyFilter && (
                <button
                  onClick={resetFilters}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-rose-200"
                >
                  <RotateCcw size={12} />
                  Reset all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ledger */}
      {filtered.length === 0 ? (
        <div className="glass-card text-center py-14 px-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.05] flex items-center justify-center mb-3">
            <ReceiptText size={22} className="text-white/30" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            No transactions found
          </h3>
          <p className="text-white/40 text-xs mt-1 mb-4 max-w-sm mx-auto">
            {transactions.length === 0
              ? "Add your first transaction with the + button."
              : "Nothing matches your current search and filters."}
          </p>
          {hasAnyFilter && (
            <button
              onClick={resetFilters}
              className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white border border-white/10 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {groups.map((group) => (
            <section key={group.key}>
              {group.label && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-white/[0.025] border-y border-white/[0.04] first:border-t-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                    {group.label}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-mono tabular-nums",
                      group.net > 0
                        ? "text-emerald-400/80"
                        : group.net < 0
                          ? "text-rose-400/80"
                          : "text-white/30",
                      privacyMode && "privacy-blur",
                    )}
                  >
                    {group.net > 0 ? "+" : group.net < 0 ? "-" : ""}
                    {formatCurrency(group.net, "EGP").replace("EGP ", "")}
                  </span>
                </div>
              )}

              <ul className="divide-y divide-white/[0.04]">
                {group.items.map((tx) => {
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
                        className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 text-left hover:bg-white/[0.035] focus-visible:bg-white/[0.05] focus:outline-none transition-colors group"
                        aria-label={`View details for ${tx.note || tx.category}`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{
                            backgroundColor: `${catColor}1f`,
                            color: catColor,
                          }}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-semibold text-white truncate">
                              {tx.note || tx.category}
                            </p>
                            {tx.isRecurring && (
                              <Repeat
                                size={11}
                                className="text-blue-400 flex-shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-white/40 truncate">
                            <span
                              style={{ color: catColor }}
                              className="opacity-90"
                            >
                              {tx.category}
                            </span>
                            <span className="mx-1 text-white/20">•</span>
                            {fromAcc?.name ?? "Account"}
                            {toAcc && (
                              <span className="text-sky-400">
                                {" "}
                                → {toAcc.name}
                              </span>
                            )}
                            {sortField !== "date" && (
                              <>
                                <span className="mx-1 text-white/20">•</span>
                                {formatDayLabel(tx.date)}
                              </>
                            )}
                          </p>
                        </div>

                        <p
                          className={cn(
                            "text-sm font-bold font-mono tabular-nums whitespace-nowrap",
                            meta.text,
                            privacyMode && "privacy-blur",
                          )}
                        >
                          {meta.sign}
                          {formatCurrency(
                            tx.amount,
                            fromAcc?.currency || "EGP",
                          )}
                        </p>
                        <ChevronRight
                          size={14}
                          className="text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all flex-shrink-0 hidden sm:block"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 text-xs text-white/45">
            <p className="font-mono">
              <span className="text-white font-medium">
                {startResult}–{endResult}
              </span>{" "}
              of{" "}
              <span className="text-white font-medium">{filtered.length}</span>
            </p>
            <label className="flex items-center gap-1.5">
              <span>Per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#111827] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                aria-label="Items per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={40}>40</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className={pagerBtn}
              aria-label="First page"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className={pagerBtn}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="px-3 h-8 flex items-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white/80 min-w-[72px] justify-center">
              <span className="text-white font-semibold">
                {safeCurrentPage}
              </span>
              <span className="text-white/30 mx-1">/</span>
              <span>{totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className={pagerBtn}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className={pagerBtn}
              aria-label="Last page"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
