import { useState } from "react";
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Trash2,
  Calendar,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Tag,
  Pencil,
  Pause,
  Play,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatCurrency, formatDate, cn } from "../../lib/utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../types";
import type { RecurringBill } from "../../types";

export function SubscriptionsPanel() {
  const {
    recurring,
    accounts,
    addRecurringBill,
    updateRecurring,
    toggleRecurringStatus,
    deleteRecurringBill,
    markBillAsPaid,
    privacyMode,
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("monthly");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] as string);
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [status, setStatus] = useState<"active" | "paused">("active");

  const todayStr = new Date().toISOString().split("T")[0];

  const openAddModal = () => {
    setEditingBill(null);
    setName("");
    setAmount("");
    setFrequency("monthly");
    setType("expense");
    setCategory(EXPENSE_CATEGORIES[0]);
    setNextDueDate(new Date().toISOString().split("T")[0]);
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
    setAccountId(bill.accountId);
    setStatus(bill.status ?? "active");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !accountId) return;

    if (editingBill) {
      updateRecurring(editingBill.id, {
        name: name.trim(),
        amount: parsedAmount,
        frequency,
        type,
        category,
        nextDueDate,
        accountId,
        status,
      });
    } else {
      addRecurringBill({
        name: name.trim(),
        amount: parsedAmount,
        frequency,
        type,
        category,
        nextDueDate,
        accountId,
        status,
      });
    }

    setShowModal(false);
    setEditingBill(null);
  };

  // Status helper: Returns pill style & text
  const getDueStatus = (dueDate: string, billStatus: "active" | "paused" = "active") => {
    if (billStatus === "paused") {
      return {
        label: "Paused",
        badgeClass: "bg-white/[0.08] text-white/50 border-white/10",
        urgent: false,
        isOverdue: false,
      };
    }

    const diffDays = Math.ceil(
      (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return {
        label: `Overdue (${Math.abs(diffDays)}d)`,
        badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        urgent: true,
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: "Due Today",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse",
        urgent: true,
        isOverdue: false,
      };
    }
    if (diffDays === 1) {
      return {
        label: "Due Tomorrow",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/25",
        urgent: true,
        isOverdue: false,
      };
    }
    if (diffDays <= 7) {
      return {
        label: `Due in ${diffDays} days`,
        badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/25",
        urgent: false,
        isOverdue: false,
      };
    }
    return {
      label: `Due in ${diffDays} days`,
      badgeClass: "bg-white/[0.05] text-white/60 border-white/10",
      urgent: false,
      isOverdue: false,
    };
  };

  // Summary Metrics (active only)
  const activeBills = recurring.filter((r) => (r.status ?? "active") === "active");

  const monthlyExpenses = activeBills
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + (r.frequency === "monthly" ? r.amount : r.amount / 12), 0);

  const monthlyIncome = activeBills
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + (r.frequency === "monthly" ? r.amount : r.amount / 12), 0);

  const upcoming7Days = activeBills.filter((r) => {
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
    return r.type === "expense" && r.nextDueDate >= todayStr && r.nextDueDate <= in7;
  });

  const filteredBills = recurring.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    const rStatus = r.status ?? "active";
    if (statusFilter !== "all" && rStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Subscriptions & Recurring Bills</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {recurring.length} items
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Track fixed expenses, utilities, memberships, and automated salary streams.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-blue-600/20 border border-blue-400/20"
        >
          <Plus size={16} />
          <span>Add Recurring Bill</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Monthly Commitments */}
        <Card className="p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="stat-label">Active Monthly Outflow</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <TrendingDown size={17} />
            </div>
          </div>
          <p
            className={cn(
              "stat-value text-2xl font-bold text-rose-400 mt-2 font-mono tabular-nums",
              privacyMode && "privacy-blur",
            )}
          >
            {formatCurrency(monthlyExpenses, "EGP")}
            <span className="text-xs text-white/40 font-normal"> / mo</span>
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            Annualized: {formatCurrency(monthlyExpenses * 12, "EGP")}
          </p>
        </Card>

        {/* Monthly Recurring Income */}
        <Card className="p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="stat-label">Fixed Recurring Inflow</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={17} />
            </div>
          </div>
          <p
            className={cn(
              "stat-value text-2xl font-bold text-emerald-400 mt-2 font-mono tabular-nums",
              privacyMode && "privacy-blur",
            )}
          >
            {formatCurrency(monthlyIncome, "EGP")}
            <span className="text-xs text-white/40 font-normal"> / mo</span>
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            Salaries & steady contract retainers
          </p>
        </Card>

        {/* Next 7 Days Attention */}
        <Card className="p-4 sm:p-5 relative overflow-hidden border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="stat-label text-amber-300">Due in Next 7 Days</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CalendarClock size={17} />
            </div>
          </div>
          <p className="stat-value text-2xl font-bold text-white mt-2 font-mono">
            {upcoming7Days.length}{" "}
            <span className="text-xs text-white/40 font-normal">bills pending</span>
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">
            Totaling {formatCurrency(upcoming7Days.reduce((s, b) => s + b.amount, 0), "EGP")}
          </p>
        </Card>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          {(["all", "expense", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                filterType === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-white/45 hover:text-white/80",
              )}
            >
              {t === "all" ? "All Commitments" : t === "expense" ? "Expenses & Bills" : "Income"}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          {(["all", "active", "paused"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                statusFilter === s
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              {s === "all" ? "All Status" : s === "active" ? "Active" : "Paused"}
            </button>
          ))}
        </div>
      </div>

      {/* Commitments List / Cards */}
      {filteredBills.length === 0 ? (
        <Card className="text-center py-14 p-6">
          <CalendarClock size={36} className="mx-auto text-white/20 mb-3" />
          <h3 className="text-base font-semibold text-white">No commitments found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-4">
            Add recurring subscriptions like Fiber Internet, Gym, Netflix, or recurring salary to stay in full control.
          </p>
          <Button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs mx-auto"
          >
            <Plus size={14} className="mr-1.5" />
            Add First Item
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBills.map((bill) => {
            const account = accounts.find((a) => a.id === bill.accountId);
            const billStatus = bill.status ?? "active";
            const isPaused = billStatus === "paused";
            const statusInfo = getDueStatus(bill.nextDueDate, billStatus);

            return (
              <div
                key={bill.id}
                className={cn(
                  "glass-card p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 border relative overflow-hidden group",
                  isPaused
                    ? "opacity-60 border-white/[0.05] bg-white/[0.01]"
                    : statusInfo.isOverdue
                      ? "border-rose-500/30 bg-[#1a1215]"
                      : statusInfo.urgent
                        ? "border-amber-500/30 bg-[#161722]"
                        : "border-white/[0.08] hover:border-white/20",
                )}
              >
                {/* 1. Header: Icon, Name, Category/Frequency, Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold mt-0.5",
                        isPaused
                          ? "bg-white/[0.05] text-white/40 border border-white/10"
                          : bill.type === "income"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30",
                      )}
                    >
                      {bill.type === "income" ? (
                        <TrendingUp size={18} />
                      ) : statusInfo.isOverdue ? (
                        <AlertCircle size={18} />
                      ) : (
                        <TrendingDown size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white truncate" title={bill.name}>
                          {bill.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Tag size={11} className="text-white/40" />
                          <span>{bill.category}</span>
                        </span>
                        <span>•</span>
                        <span className="capitalize font-medium text-white/60">
                          {bill.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill in Header */}
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 flex items-center gap-1",
                      statusInfo.badgeClass,
                    )}
                  >
                    {isPaused && <Clock size={11} />}
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* 2. Middle Section: Large tabular-nums amount + Linked Account badge */}
                <div className="flex items-end justify-between gap-3 pt-2">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase font-medium tracking-wider block">
                      {bill.type === "income" ? "Recurring Inflow" : "Recurring Outflow"}
                    </span>
                    <p
                      className={cn(
                        "text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums mt-0.5",
                        isPaused
                          ? "text-white/40"
                          : bill.type === "income"
                            ? "text-emerald-400"
                            : "text-white",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {bill.type === "income" ? "+" : "-"}
                      {formatCurrency(bill.amount, account?.currency || "EGP")}
                    </p>
                  </div>

                  {/* Linked Account Pill */}
                  <div className="text-right">
                    <span className="text-[10px] text-white/40 block mb-0.5">Account</span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-white/70">
                      <CreditCard size={12} className="text-blue-400" />
                      <span className="truncate max-w-[120px]">{account?.name || "Account"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Footer / Action Bar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
                  {/* Next Due Date */}
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Calendar size={13} className="text-white/40" />
                    <span>Next:</span>
                    <span className="font-mono text-white/80 font-medium">
                      {formatDate(bill.nextDueDate)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Mark Paid button */}
                    <button
                      onClick={() => markBillAsPaid(bill.id)}
                      disabled={isPaused}
                      className={cn(
                        "px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border",
                        isPaused
                          ? "opacity-40 cursor-not-allowed bg-white/[0.03] text-white/40 border-white/5"
                          : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 active:scale-95 shadow-sm",
                      )}
                      title="Log payment into account and roll next due date by 1 cycle"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Paid</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/10 transition-colors"
                      title="Edit Subscription Details"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Pause / Resume Button */}
                    <button
                      onClick={() => toggleRecurringStatus(bill.id)}
                      className={cn(
                        "p-1.5 rounded-xl border transition-colors",
                        isPaused
                          ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30"
                          : "bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/10",
                      )}
                      title={isPaused ? "Resume Subscription" : "Pause Subscription"}
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteRecurringBill(bill.id)}
                      className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/10 transition-colors"
                      title="Delete Subscription"
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

      {/* Add / Edit Subscription Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingBill(null);
          }}
          title={editingBill ? `Edit Commitment · ${editingBill.name}` : "Add Recurring Commitment"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 bg-white/[0.05] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  if (!EXPENSE_CATEGORIES.includes(category as any)) {
                    setCategory(EXPENSE_CATEGORIES[0]);
                  }
                }}
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
                onClick={() => {
                  setType("income");
                  if (!INCOME_CATEGORIES.includes(category as any)) {
                    setCategory(INCOME_CATEGORIES[0]);
                  }
                }}
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

            {/* Name */}
            <div>
              <label className="label-base">Commitment Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Fiber Internet, Gym Membership, Netflix"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
              />
            </div>

            {/* Amount & Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-base font-mono font-bold"
                />
              </div>

              <div>
                <label className="label-base">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as "monthly" | "yearly")}
                  className="input-base [&>option]:bg-[#111827]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Category & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-base [&>option]:bg-[#111827]"
                >
                  {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-base">Debit / Credit Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-base [&>option]:bg-[#111827]"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Next Due Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Next Due Date</label>
                <input
                  type="date"
                  required
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="label-base">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "paused")}
                  className="input-base [&>option]:bg-[#111827]"
                >
                  <option value="active">Active (Processing & Alerts)</option>
                  <option value="paused">Paused (Suspended)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowModal(false);
                  setEditingBill(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                {editingBill ? "Save Changes" : "Create Commitment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
