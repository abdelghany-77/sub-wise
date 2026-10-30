import { useMemo, useState } from "react";
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Trash2,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Pencil,
  Pause,
  Play,
  AlertCircle,
  Repeat,
  Scale,
  FilterX,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input, Select } from "../ui/FormFields";
import { formatCurrency, parseLocalDate, cn } from "../../lib/utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../types";
import type { RecurringBill } from "../../types";

type TypeFilter = "all" | "expense" | "income";
type StatusFilter = "all" | "active" | "paused";
type BillStatus = "active" | "paused";

const DAY_MS = 864e5;

const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDueDate = (dateStr: string) => {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== new Date().getFullYear()
      ? { year: "numeric" }
      : {}),
  });
};

const iconBtn =
  "inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";

const chipBase =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";

interface DueInfo {
  label: string;
  badgeClass: string;
  days: number;
  urgent: boolean;
  isOverdue: boolean;
}

function getDueInfo(dueDate: string, status: BillStatus, today: Date): DueInfo {
  const days = Math.round(
    (parseLocalDate(dueDate).getTime() - today.getTime()) / DAY_MS,
  );

  if (status === "paused") {
    return {
      label: "Paused",
      badgeClass: "bg-white/[0.06] text-white/50 border-white/10",
      days,
      urgent: false,
      isOverdue: false,
    };
  }
  if (days < 0) {
    return {
      label: `Overdue ${Math.abs(days)}d`,
      badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      days,
      urgent: true,
      isOverdue: true,
    };
  }
  if (days === 0) {
    return {
      label: "Due today",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/35",
      days,
      urgent: true,
      isOverdue: false,
    };
  }
  if (days === 1) {
    return {
      label: "Tomorrow",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/25",
      days,
      urgent: true,
      isOverdue: false,
    };
  }
  if (days <= 7) {
    return {
      label: `In ${days} days`,
      badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/25",
      days,
      urgent: false,
      isOverdue: false,
    };
  }
  return {
    label: `In ${days} days`,
    badgeClass: "bg-white/[0.05] text-white/55 border-white/10",
    days,
    urgent: false,
    isOverdue: false,
  };
}

export function SubscriptionsPanel() {
  const {
    recurring,
    accounts,
    exchangeRates,
    addRecurringBill,
    updateRecurring,
    toggleRecurringStatus,
    deleteRecurringBill,
    markBillAsPaid,
    privacyMode,
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringBill | null>(null);
  const [filterType, setFilterType] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("monthly");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [nextDueDate, setNextDueDate] = useState(() => toLocalISO(new Date()));
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [status, setStatus] = useState<BillStatus>("active");

  const blur = privacyMode && "privacy-blur";

  const closeModal = () => {
    setShowModal(false);
    setEditingBill(null);
  };

  const openAddModal = () => {
    setEditingBill(null);
    setName("");
    setAmount("");
    setFrequency("monthly");
    setType("expense");
    setCategory(EXPENSE_CATEGORIES[0]);
    setNextDueDate(toLocalISO(new Date()));
    setAccountId(accounts[0]?.id || "");
    setStatus("active");
    setShowModal(true);
  };

  const openEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setName(bill.name);
    setAmount(String(bill.amount));
    setFrequency(bill.frequency);
    setType(bill.type);
    setCategory(bill.category);
    setNextDueDate(bill.nextDueDate);
    setAccountId(
      accounts.some((a) => a.id === bill.accountId)
        ? bill.accountId
        : accounts[0]?.id || "",
    );
    setStatus(bill.status ?? "active");
    setShowModal(true);
  };

  const switchType = (next: "expense" | "income") => {
    setType(next);
    const list: readonly string[] =
      next === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!list.includes(category)) setCategory(list[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (
      !name.trim() ||
      isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      !accountId ||
      !nextDueDate
    ) {
      return;
    }

    const payload = {
      name: name.trim(),
      amount: parsedAmount,
      frequency,
      type,
      category,
      nextDueDate,
      accountId,
      status,
    };

    if (editingBill) {
      updateRecurring(editingBill.id, payload);
    } else {
      addRecurringBill(payload);
    }
    closeModal();
  };

  const today = startOfToday();
  const todayKey = today.getTime();

  const rateFor = (accId: string) => {
    const currency = accounts.find((a) => a.id === accId)?.currency;
    if (!currency || currency === "EGP") return 1;
    return exchangeRates[currency] ?? 1;
  };

  const monthlyEgp = (bill: RecurringBill) =>
    (bill.frequency === "monthly" ? bill.amount : bill.amount / 12) *
    rateFor(bill.accountId);

  const stats = useMemo(() => {
    const t = new Date(todayKey);
    const active = recurring.filter((r) => (r.status ?? "active") === "active");
    const activeExpenses = active.filter((r) => r.type === "expense");
    const activeIncome = active.filter((r) => r.type === "income");
    const outflow = activeExpenses.reduce((s, r) => s + monthlyEgp(r), 0);
    const inflow = activeIncome.reduce((s, r) => s + monthlyEgp(r), 0);

    const dueSoon = activeExpenses.filter(
      (r) => getDueInfo(r.nextDueDate, "active", t).days <= 7,
    );
    const overdue = dueSoon.filter(
      (r) => getDueInfo(r.nextDueDate, "active", t).days < 0,
    );
    const dueSoonTotal = dueSoon.reduce(
      (s, r) => s + r.amount * rateFor(r.accountId),
      0,
    );

    return {
      outflow,
      inflow,
      net: inflow - outflow,
      expenseCount: activeExpenses.length,
      incomeCount: activeIncome.length,
      dueSoonCount: dueSoon.length,
      overdueCount: overdue.length,
      dueSoonTotal,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring, accounts, exchangeRates, todayKey]);

  const typeCounts = {
    all: recurring.length,
    expense: recurring.filter((r) => r.type === "expense").length,
    income: recurring.filter((r) => r.type === "income").length,
  };

  const filteredBills = useMemo(() => {
    return recurring
      .filter((r) => {
        if (filterType !== "all" && r.type !== filterType) return false;
        if (statusFilter !== "all" && (r.status ?? "active") !== statusFilter)
          return false;
        return true;
      })
      .sort((a, b) => {
        const aPaused = (a.status ?? "active") === "paused" ? 1 : 0;
        const bPaused = (b.status ?? "active") === "paused" ? 1 : 0;
        if (aPaused !== bPaused) return aPaused - bPaused;
        return a.nextDueDate.localeCompare(b.nextDueDate);
      });
  }, [recurring, filterType, statusFilter]);

  const hasFilters = filterType !== "all" || statusFilter !== "all";
  const clearFilters = () => {
    setFilterType("all");
    setStatusFilter("all");
  };

  const netPositive = stats.net >= 0;
  const categoryOptions = (
    type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  ) as readonly string[];
  const categoryList = categoryOptions.includes(category)
    ? categoryOptions
    : [category, ...categoryOptions];

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card padding="sm" className="!p-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label text-[10px] tracking-wider truncate">
              Outflow / mo
            </span>
            <TrendingDown size={14} className="text-rose-400 flex-shrink-0" />
          </div>
          <p
            className={cn(
              "text-base sm:text-lg font-bold font-mono tabular-nums text-rose-400 mt-1 truncate",
              blur,
            )}
          >
            {formatCurrency(stats.outflow, "EGP")}
          </p>
          <p className="text-[11px] text-white/40 truncate">
            {stats.expenseCount} active ·{" "}
            <span className={blur || undefined}>
              {formatCurrency(stats.outflow * 12, "EGP")}
            </span>{" "}
            / yr
          </p>
        </Card>

        <Card padding="sm" className="!p-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label text-[10px] tracking-wider truncate">
              Inflow / mo
            </span>
            <TrendingUp size={14} className="text-emerald-400 flex-shrink-0" />
          </div>
          <p
            className={cn(
              "text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1 truncate",
              blur,
            )}
          >
            {formatCurrency(stats.inflow, "EGP")}
          </p>
          <p className="text-[11px] text-white/40 truncate">
            {stats.incomeCount} active stream
            {stats.incomeCount === 1 ? "" : "s"}
          </p>
        </Card>

        <Card padding="sm" className="!p-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label text-[10px] tracking-wider truncate">
              Net / mo
            </span>
            <Scale size={14} className="text-white/40 flex-shrink-0" />
          </div>
          <p
            className={cn(
              "text-base sm:text-lg font-bold font-mono tabular-nums mt-1 truncate",
              netPositive ? "text-emerald-400" : "text-rose-400",
              blur,
            )}
          >
            {netPositive ? "+" : "-"}
            {formatCurrency(stats.net, "EGP")}
          </p>
          <p className="text-[11px] text-white/40 truncate">
            Recurring inflow − outflow
          </p>
        </Card>

        <Card
          padding="sm"
          className={cn(
            "!p-3 min-w-0",
            stats.overdueCount > 0
              ? "border-rose-500/30"
              : stats.dueSoonCount > 0
                ? "border-amber-500/25"
                : "",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label text-[10px] tracking-wider truncate text-amber-300/90">
              Due ≤ 7 days
            </span>
            <CalendarClock size={14} className="text-amber-400 flex-shrink-0" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono tabular-nums text-white mt-1 truncate">
            {stats.dueSoonCount}
            <span className="text-xs text-white/40 font-normal">
              {" "}
              bill{stats.dueSoonCount === 1 ? "" : "s"}
            </span>
            {stats.overdueCount > 0 && (
              <span className="text-xs text-rose-400 font-semibold">
                {" "}
                · {stats.overdueCount} overdue
              </span>
            )}
          </p>
          <p className={cn("text-[11px] text-amber-400/80 truncate", blur)}>
            {formatCurrency(stats.dueSoonTotal, "EGP")}
          </p>
        </Card>
      </div>

      {/* Toolbar: filter chips + add */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filter by type"
          className="inline-flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]"
        >
          {(
            [
              ["all", "All"],
              ["expense", "Bills"],
              ["income", "Income"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filterType === key}
              onClick={() => setFilterType(key)}
              className={cn(
                chipBase,
                filterType === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              {label}
              <span
                className={cn(
                  "font-mono text-[10px]",
                  filterType === key ? "text-white/80" : "text-white/35",
                )}
              >
                {typeCounts[key]}
              </span>
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Filter by status"
          className="inline-flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]"
        >
          {(
            [
              ["all", "Any status"],
              ["active", "Active"],
              ["paused", "Paused"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={statusFilter === key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                chipBase,
                statusFilter === key
                  ? "bg-white/[0.12] text-white"
                  : "text-white/45 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className={cn(chipBase, "text-white/50 hover:text-white")}
          >
            <FilterX size={13} />
            Clear
          </button>
        )}

        <Button
          onClick={openAddModal}
          size="sm"
          icon={<Plus size={15} />}
          className="ml-auto bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 shadow-lg shadow-blue-600/20"
        >
          Add bill
        </Button>
      </div>

      {/* List */}
      {filteredBills.length === 0 ? (
        <Card className="text-center !py-10">
          <CalendarClock size={32} className="mx-auto text-white/20 mb-2" />
          <h3 className="text-sm font-semibold text-white">
            {recurring.length === 0
              ? "No recurring bills yet"
              : "Nothing matches these filters"}
          </h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-4">
            {recurring.length === 0
              ? "Add subscriptions like internet, gym or Netflix, or a recurring salary, to see what's due and what it costs per month."
              : "Try a different type or status to see more of your recurring items."}
          </p>
          {recurring.length === 0 ? (
            <Button
              onClick={openAddModal}
              size="sm"
              icon={<Plus size={14} />}
              className="bg-blue-600 hover:bg-blue-500 text-white mx-auto"
            >
              Add first bill
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              icon={<FilterX size={14} />}
              className="mx-auto"
            >
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {filteredBills.map((bill) => {
            const account = accounts.find((a) => a.id === bill.accountId);
            const currency = account?.currency || "EGP";
            const billStatus: BillStatus = bill.status ?? "active";
            const isPaused = billStatus === "paused";
            const isIncome = bill.type === "income";
            const due = getDueInfo(bill.nextDueDate, billStatus, today);

            return (
              <div
                key={bill.id}
                className={cn(
                  "glass-card rounded-2xl p-3 flex flex-col gap-2.5 border transition-colors duration-200 animate-fade-in",
                  isPaused
                    ? "border-white/[0.05] opacity-70"
                    : due.isOverdue
                      ? "border-rose-500/30 bg-rose-500/[0.04]"
                      : due.urgent
                        ? "border-amber-500/30"
                        : "border-white/[0.08] hover:border-white/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border",
                      isPaused
                        ? "bg-white/[0.05] text-white/40 border-white/10"
                        : isIncome
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : due.isOverdue
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : "bg-blue-500/15 text-blue-400 border-blue-500/25",
                    )}
                  >
                    {isIncome ? (
                      <TrendingUp size={16} />
                    ) : due.isOverdue ? (
                      <AlertCircle size={16} />
                    ) : (
                      <Repeat size={16} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm font-semibold text-white truncate"
                      title={bill.name}
                    >
                      {bill.name}
                    </h4>
                    <p className="text-[11px] text-white/45 truncate flex items-center gap-1">
                      <span className="truncate">{bill.category}</span>
                      <span aria-hidden>·</span>
                      <span className="capitalize flex-shrink-0">
                        {bill.frequency}
                      </span>
                      <span aria-hidden>·</span>
                      <CreditCard
                        size={10}
                        className="text-white/35 flex-shrink-0"
                        aria-hidden
                      />
                      <span className="truncate">
                        {account?.name || "No account"}
                      </span>
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "text-sm sm:text-base font-bold font-mono tabular-nums leading-tight",
                        isPaused
                          ? "text-white/40"
                          : isIncome
                            ? "text-emerald-400"
                            : "text-white",
                        blur,
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(bill.amount, currency)}
                    </p>
                    {bill.frequency === "yearly" && (
                      <p
                        className={cn(
                          "text-[10px] text-white/40 font-mono",
                          blur,
                        )}
                      >
                        ≈ {formatCurrency(bill.amount / 12, currency)} / mo
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
                        due.badgeClass,
                      )}
                    >
                      {due.label}
                    </span>
                    <span className="text-[11px] text-white/45 font-mono truncate">
                      {formatDueDate(bill.nextDueDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => markBillAsPaid(bill.id)}
                      disabled={isPaused}
                      aria-label={
                        isIncome
                          ? `Mark ${bill.name} as received`
                          : `Mark ${bill.name} as paid`
                      }
                      title={
                        isPaused
                          ? "Resume to log a payment"
                          : "Log the transaction and move the due date to the next cycle"
                      }
                      className={cn(
                        iconBtn,
                        "w-auto px-2.5 gap-1.5 text-xs font-semibold",
                        isPaused
                          ? "opacity-40 cursor-not-allowed bg-white/[0.03] text-white/40 border-white/5"
                          : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30",
                      )}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isIncome ? "Received" : "Paid"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(bill)}
                      aria-label={`Edit ${bill.name}`}
                      title="Edit"
                      className={cn(
                        iconBtn,
                        "bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border-white/10",
                      )}
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleRecurringStatus(bill.id)}
                      aria-label={
                        isPaused ? `Resume ${bill.name}` : `Pause ${bill.name}`
                      }
                      title={isPaused ? "Resume" : "Pause"}
                      className={cn(
                        iconBtn,
                        isPaused
                          ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30"
                          : "bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border-white/10",
                      )}
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(bill)}
                      aria-label={`Delete ${bill.name}`}
                      title="Delete"
                      className={cn(
                        iconBtn,
                        "bg-white/[0.05] hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border-white/10",
                      )}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteRecurringBill(deleteTarget.id);
        }}
        title="Delete recurring bill?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. Past transactions already logged for it are kept.`
            : ""
        }
      />

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={
            editingBill ? `Edit · ${editingBill.name}` : "Add recurring bill"
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-white/[0.05] p-1 rounded-xl">
              <button
                type="button"
                aria-pressed={type === "expense"}
                onClick={() => switchType("expense")}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold transition-all",
                  type === "expense"
                    ? "bg-rose-500 text-white shadow-md"
                    : "text-white/50 hover:text-white",
                )}
              >
                Expense / Outflow
              </button>
              <button
                type="button"
                aria-pressed={type === "income"}
                onClick={() => switchType("income")}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold transition-all",
                  type === "income"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-white/50 hover:text-white",
                )}
              >
                Income / Salary
              </button>
            </div>

            <Input
              label="Name"
              type="text"
              required
              placeholder="e.g. Fiber Internet, Gym Membership, Netflix"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono font-bold"
              />
              <Select
                label="Frequency"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as "monthly" | "yearly")
                }
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryList.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label={
                  type === "expense" ? "Pay from account" : "Deposit to account"
                }
                value={accountId}
                required
                onChange={(e) => setAccountId(e.target.value)}
                options={accounts.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.currency})`,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Next due date"
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BillStatus)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "paused", label: "Paused" },
                ]}
              />
            </div>

            {accounts.length === 0 && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Create an account first, then you can attach recurring bills to
                it.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={accounts.length === 0}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {editingBill ? "Save changes" : "Add bill"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
