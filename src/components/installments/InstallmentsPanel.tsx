import { useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Pencil,
  Trash2,
  CalendarClock,
  Layers,
  Wallet,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input, Select } from "../ui/FormFields";
import {
  amountInBase,
  cn,
  formatCurrency,
  getAccountBalanceCurrency,
  parseLocalDate,
  todayISO,
} from "../../lib/utils";
import { EXPENSE_CATEGORIES, type Installment } from "../../types";

const DAY_MS = 864e5;
const QUICK_PROVIDERS = ["ValU", "CIB", "NBE", "Sympl", "Suhoola", "Contact", "Bank"];

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

function getDueBadge(plan: Installment, today: Date) {
  if (plan.status === "completed") {
    return {
      label: "Paid off",
      tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      isOverdue: false,
      urgent: false,
    };
  }
  const days = Math.round(
    (parseLocalDate(plan.nextDueDate).getTime() - today.getTime()) / DAY_MS,
  );
  if (days < 0) {
    return {
      label: `Overdue ${Math.abs(days)}d`,
      tone: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      isOverdue: true,
      urgent: true,
    };
  }
  if (days === 0) {
    return {
      label: "Due today",
      tone: "bg-amber-500/20 text-amber-300 border-amber-500/35",
      isOverdue: false,
      urgent: true,
    };
  }
  if (days <= 7) {
    return {
      label: `In ${days}d`,
      tone: "bg-blue-500/15 text-blue-300 border-blue-500/25",
      isOverdue: false,
      urgent: days <= 2,
    };
  }
  return {
    label: `In ${days}d`,
    tone: "bg-white/[0.05] text-white/55 border-white/10",
    isOverdue: false,
    urgent: false,
  };
}

export function InstallmentsPanel() {
  const {
    installments,
    accounts,
    customCategories,
    exchangeRates,
    privacyMode,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    payInstallment,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<"active" | "completed" | "all">("active");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Installment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Installment | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("ValU");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [totalMonths, setTotalMonths] = useState("12");
  const [paidMonths, setPaidMonths] = useState("0");
  const [nextDueDate, setNextDueDate] = useState(() => todayISO());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [category, setCategory] = useState<string>("Debt & Loan Payments");
  const [note, setNote] = useState("");

  const blur = privacyMode && "privacy-blur";
  const today = startOfToday();

  const expenseCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...EXPENSE_CATEGORIES,
          ...customCategories
            .filter((c) => c.type === "expense")
            .map((c) => c.name),
        ]),
      ),
    [customCategories],
  );

  const stats = useMemo(() => {
    const active = installments.filter((p) => p.status === "active");
    const completed = installments.filter((p) => p.status === "completed");
    let monthlyCommitment = 0;
    let totalRemaining = 0;

    for (const p of active) {
      const acc = accounts.find((a) => a.id === p.accountId);
      const monthlyBase = amountInBase(p.monthlyAmount, acc, exchangeRates);
      const remainingMonths = Math.max(0, p.totalMonths - p.paidMonths);
      monthlyCommitment += monthlyBase;
      totalRemaining += monthlyBase * remainingMonths;
    }

    return {
      activeCount: active.length,
      completedCount: completed.length,
      monthlyCommitment,
      totalRemaining,
    };
  }, [installments, accounts, exchangeRates]);

  const filtered = useMemo(() => {
    return installments
      .filter((p) => statusFilter === "all" || p.status === statusFilter)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return a.nextDueDate.localeCompare(b.nextDueDate);
      });
  }, [installments, statusFilter]);

  const openAdd = () => {
    setEditingPlan(null);
    setName("");
    setProvider("ValU");
    setMonthlyAmount("");
    setTotalMonths("12");
    setPaidMonths("0");
    setNextDueDate(todayISO());
    setAccountId(accounts[0]?.id ?? "");
    setCategory("Debt & Loan Payments");
    setNote("");
    setShowModal(true);
  };

  const openEdit = (plan: Installment) => {
    setEditingPlan(plan);
    setName(plan.name);
    setProvider(plan.provider ?? "");
    setMonthlyAmount(String(plan.monthlyAmount));
    setTotalMonths(String(plan.totalMonths));
    setPaidMonths(String(plan.paidMonths));
    setNextDueDate(plan.nextDueDate);
    setAccountId(
      accounts.some((a) => a.id === plan.accountId)
        ? plan.accountId
        : (accounts[0]?.id ?? ""),
    );
    setCategory(plan.category);
    setNote(plan.note ?? "");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthly = parseFloat(monthlyAmount);
    const months = Math.max(1, parseInt(totalMonths, 10) || 1);
    const paid = Math.min(months, Math.max(0, parseInt(paidMonths, 10) || 0));
    if (!name.trim() || isNaN(monthly) || monthly <= 0 || !accountId || !nextDueDate) {
      return;
    }

    const total = Math.round(monthly * months * 100) / 100;

    if (editingPlan) {
      updateInstallment(editingPlan.id, {
        name: name.trim(),
        provider: provider.trim() || undefined,
        monthlyAmount: monthly,
        totalMonths: months,
        paidMonths: paid,
        totalAmount: total,
        nextDueDate,
        accountId,
        category,
        note: note.trim() || undefined,
        status: paid >= months ? "completed" : "active",
      });
    } else {
      addInstallment({
        name: name.trim(),
        provider: provider.trim() || undefined,
        monthlyAmount: monthly,
        totalMonths: months,
        paidMonths: paid,
        totalAmount: total,
        nextDueDate,
        accountId,
        category,
        note: note.trim() || undefined,
      });
    }
    setShowModal(false);
    setEditingPlan(null);
  };

  const previewTotal =
    (parseFloat(monthlyAmount) || 0) * Math.max(1, parseInt(totalMonths, 10) || 0);

  return (
    <div className="space-y-3">
      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card padding="sm" className="!p-2.5 sm:!p-3.5 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="stat-label text-[10px] tracking-wider truncate">
              Active Plans
            </span>
            <Layers size={14} className="text-violet-400 flex-shrink-0" />
          </div>
          <p className="text-base sm:text-lg font-bold font-mono tabular-nums text-white mt-1">
            {stats.activeCount}
            {stats.completedCount > 0 && (
              <span className="text-[11px] font-normal text-white/40 ml-1">
                · {stats.completedCount} done
              </span>
            )}
          </p>
        </Card>

        <Card padding="sm" className="!p-2.5 sm:!p-3.5 min-w-0 border-amber-500/20">
          <div className="flex items-center justify-between gap-1">
            <span className="stat-label text-[10px] tracking-wider truncate">
              Monthly / mo
            </span>
            <CalendarClock size={14} className="text-amber-400 flex-shrink-0" />
          </div>
          <p
            className={cn(
              "text-sm sm:text-lg font-bold font-mono tabular-nums text-amber-300 mt-1 truncate",
              blur,
            )}
          >
            {formatCurrency(stats.monthlyCommitment, "EGP")}
          </p>
        </Card>

        <Card padding="sm" className="!p-2.5 sm:!p-3.5 min-w-0 border-rose-500/20">
          <div className="flex items-center justify-between gap-1">
            <span className="stat-label text-[10px] tracking-wider truncate">
              Remaining
            </span>
            <Wallet size={14} className="text-rose-400 flex-shrink-0" />
          </div>
          <p
            className={cn(
              "text-sm sm:text-lg font-bold font-mono tabular-nums text-rose-400 mt-1 truncate",
              blur,
            )}
          >
            {formatCurrency(stats.totalRemaining, "EGP")}
          </p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Filter installments by status"
          className="inline-flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.06]"
        >
          {(
            [
              ["active", "Active"],
              ["completed", "Paid Off"],
              ["all", "All"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={statusFilter === key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-all",
                statusFilter === key
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          icon={<Plus size={15} />}
          onClick={openAdd}
          className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30 min-h-[38px]"
        >
          Add Installment
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center !py-10">
          <Sparkles size={30} className="mx-auto text-violet-400/40 mb-2" />
          <h3 className="text-sm font-semibold text-white">
            {installments.length === 0
              ? "No installment plans yet"
              : "No plans match this filter"}
          </h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-4">
            Track ValU, Sympl, credit card, or device installments in one place.
            Each payment logs automatically and updates your remaining months.
          </p>
          {installments.length === 0 && (
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={openAdd}
              className="bg-violet-600 hover:bg-violet-500 text-white mx-auto"
            >
              Add first installment
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {filtered.map((plan) => {
            const acc = accounts.find((a) => a.id === plan.accountId);
            const currency = getAccountBalanceCurrency(acc);
            const remainingMonths = Math.max(0, plan.totalMonths - plan.paidMonths);
            const remainingAmount = remainingMonths * plan.monthlyAmount;
            const pct =
              plan.totalMonths > 0
                ? Math.min(100, (plan.paidMonths / plan.totalMonths) * 100)
                : 100;
            const isDone = plan.status === "completed";
            const due = getDueBadge(plan, today);

            return (
              <div
                key={plan.id}
                className={cn(
                  "glass-card rounded-2xl p-3.5 flex flex-col gap-3 border transition-colors",
                  isDone
                    ? "border-emerald-500/20 opacity-75"
                    : due.isOverdue
                      ? "border-rose-500/35 bg-rose-500/[0.04]"
                      : due.urgent
                        ? "border-amber-500/30"
                        : "border-white/[0.08] hover:border-white/20",
                )}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {plan.name}
                      </h4>
                      {plan.provider && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-violet-500/15 text-violet-300 border border-violet-500/25 flex-shrink-0">
                          {plan.provider}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/45 mt-0.5 flex items-center gap-1 truncate">
                      <CreditCard size={10} className="flex-shrink-0 text-white/35" />
                      <span className="truncate">{acc?.name ?? "No account"}</span>
                      <span>·</span>
                      <span className="truncate">{plan.category}</span>
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "text-sm sm:text-base font-bold font-mono tabular-nums text-white",
                        blur,
                      )}
                    >
                      {formatCurrency(plan.monthlyAmount, currency)}
                      <span className="text-[10px] font-normal text-white/40">/mo</span>
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-mono text-white/45",
                        blur,
                      )}
                    >
                      {isDone
                        ? "Completed"
                        : `${formatCurrency(remainingAmount, currency)} left`}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/55 font-mono">
                      {plan.paidMonths} / {plan.totalMonths} months paid
                    </span>
                    <span className="text-white/45 font-mono">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isDone ? "bg-emerald-500" : "bg-violet-500",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap",
                        due.tone,
                      )}
                    >
                      {due.isOverdue && <AlertCircle size={10} />}
                      {due.label}
                    </span>
                    {!isDone && (
                      <span className="text-[11px] text-white/40 font-mono truncate">
                        {formatDueDate(plan.nextDueDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => payInstallment(plan.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 min-h-[36px] rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        <span>Pay</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(plan)}
                      aria-label={`Edit ${plan.name}`}
                      className="w-9 h-9 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/10 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(plan)}
                      aria-label={`Delete ${plan.name}`}
                      className="w-9 h-9 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/10 transition-colors"
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

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
          title={editingPlan ? `Edit · ${editingPlan.name}` : "New Installment Plan"}
        >
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Plan / Purchase Name"
              type="text"
              required
              placeholder="e.g. iPhone 16 Pro, Laptop, Home Appliances"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div>
              <Input
                label="Provider (ValU, Bank, Sympl...)"
                type="text"
                placeholder="e.g. ValU, CIB Installments"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {QUICK_PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors",
                      provider === p
                        ? "bg-violet-500/25 border-violet-400/40 text-violet-200"
                        : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Monthly Payment"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                className="font-mono font-bold"
              />
              <Input
                label="Total Months"
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                required
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value)}
                className="font-mono"
              />
              <Input
                label="Already Paid"
                type="number"
                inputMode="numeric"
                min="0"
                max={totalMonths || "120"}
                value={paidMonths}
                onChange={(e) => setPaidMonths(e.target.value)}
                className="font-mono"
              />
            </div>

            {previewTotal > 0 && (
              <div className="px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between text-xs">
                <span className="text-violet-200/80">Total Plan Value</span>
                <span className="font-mono font-bold text-violet-200">
                  {formatCurrency(
                    previewTotal,
                    getAccountBalanceCurrency(
                      accounts.find((a) => a.id === accountId),
                    ),
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Pay From Account"
                value={accountId}
                required
                onChange={(e) => setAccountId(e.target.value)}
                options={accounts.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${getAccountBalanceCurrency(a)})`,
                }))}
              />
              <Input
                label="Next Due Date"
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={expenseCategories.map((c) => ({ value: c, label: c }))}
              />
              <Input
                label="Note (Optional)"
                type="text"
                placeholder="e.g. 0% interest promo"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowModal(false);
                  setEditingPlan(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={accounts.length === 0}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {editingPlan ? "Save Changes" : "Add Installment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteInstallment(deleteTarget.id);
        }}
        title="Delete installment plan?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. Past payment transactions remain in your history.`
            : ""
        }
      />
    </div>
  );
}
