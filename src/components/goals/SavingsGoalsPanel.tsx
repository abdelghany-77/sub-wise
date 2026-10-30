import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  Banknote,
  CalendarClock,
  Check,
  PiggyBank,
  Landmark,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input, Select } from "../ui/FormFields";
import {
  formatCurrency,
  formatDate,
  parseLocalDate,
  cn,
} from "../../lib/utils";
import { PRESET_COLORS } from "../../types";
import type { SavingsGoal } from "../../types";

const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"];
const QUICK_AMOUNTS = [100, 500, 1000];
const DAYS_PER_MONTH = 30.44;

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function GoalRing({
  pct,
  color,
  complete,
  label,
}: {
  pct: number;
  color: string;
  complete: boolean;
  label: string;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return (
    <div
      className="relative w-12 h-12 flex-shrink-0"
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="4"
          className="stroke-white/[0.08]"
        />
        <circle
          cx="20"
          cy="20"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - clamped / 100)}
          stroke={complete ? "#34d399" : color}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono text-white/90">
        {complete ? (
          <Check size={16} className="text-emerald-400" />
        ) : (
          `${Math.floor(clamped)}%`
        )}
      </span>
    </div>
  );
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysUntil = (dateStr?: string) => {
  if (!dateStr) return null;
  return Math.round(
    (parseLocalDate(dateStr).getTime() - startOfToday().getTime()) / 864e5,
  );
};

function describeDays(days: number): { text: string; tone: string } {
  if (days < 0)
    return {
      text: `Overdue ${Math.abs(days)}d`,
      tone: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    };
  if (days === 0)
    return {
      text: "Due today",
      tone: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    };
  const text =
    days > 90
      ? `${Math.round(days / DAYS_PER_MONTH)} mo left`
      : `${days}d left`;
  return {
    text,
    tone:
      days <= 30
        ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
        : "bg-white/[0.05] text-white/50 border-white/[0.08]",
  };
}

export function SavingsGoalsPanel() {
  const {
    savingsGoals,
    accounts,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeSavingsGoal,
    privacyMode,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeError, setContributeError] = useState("");
  const [contributeFrom, setContributeFrom] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currency: "EGP",
    deadline: "",
    accountId: "",
    color: PRESET_COLORS[0],
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const blur = privacyMode && "privacy-blur";

  const sortedGoals = useMemo(() => {
    const rank = (g: SavingsGoal) => {
      const complete = g.currentAmount >= g.targetAmount;
      if (complete) return 2;
      return g.deadline ? 0 : 1;
    };
    return [...savingsGoals].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      if (ra === 0) return (a.deadline ?? "").localeCompare(b.deadline ?? "");
      const pa = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
      const pb = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
      return pb - pa;
    });
  }, [savingsGoals]);

  const contributeGoal = contributeGoalId
    ? savingsGoals.find((g) => g.id === contributeGoalId)
    : undefined;

  const openAdd = () => {
    setEditingGoal(null);
    setForm({
      name: "",
      targetAmount: "",
      currency: "EGP",
      deadline: "",
      accountId: "",
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    });
    setErrors({});
    setIsOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    setForm({
      name: g.name,
      targetAmount: String(g.targetAmount),
      currency: g.currency,
      deadline: g.deadline ?? "",
      accountId: g.accountId ?? "",
      color: g.color,
    });
    setErrors({});
    setIsOpen(true);
  };

  const openContribute = (g: SavingsGoal) => {
    setContributeGoalId(g.id);
    setContributeAmount("");
    setContributeError("");
  };

  const closeContribute = () => {
    setContributeFrom("");
    setContributeGoalId(null);
    setContributeAmount("");
    setContributeError("");
  };

  const handleSubmit = () => {
    const e: Partial<Record<string, string>> = {};
    if (!form.name.trim()) e.name = "Enter a goal name";
    if (
      !form.targetAmount ||
      isNaN(Number(form.targetAmount)) ||
      Number(form.targetAmount) <= 0
    )
      e.targetAmount = "Enter a valid target amount";

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const data = {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      currency: form.currency,
      deadline: form.deadline || undefined,
      accountId: form.accountId || undefined,
      color: form.color,
    };

    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, data);
    } else {
      addSavingsGoal({
        ...data,
        currentAmount: 0,
      });
    }
    setIsOpen(false);
  };

  const handleContribute = () => {
    const amount = Number(contributeAmount);
    if (!contributeGoalId) return;
    if (!contributeAmount || isNaN(amount) || amount <= 0) {
      setContributeError("Enter a valid amount");
      return;
    }
    const source = contributeFrom
      ? accounts.find((a) => a.id === contributeFrom)
      : undefined;
    if (source && amount > source.balance) {
      setContributeError(`Insufficient funds in ${source.name}`);
      return;
    }
    contributeSavingsGoal(
      contributeGoalId,
      amount,
      contributeFrom || undefined,
    );
    closeContribute();
  };

  const primaryCurrency = savingsGoals[0]?.currency ?? "EGP";
  const summaryGoals = savingsGoals.filter(
    (g) => g.currency === primaryCurrency,
  );
  const hasMixedCurrencies = summaryGoals.length !== savingsGoals.length;
  const totalTarget = summaryGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = summaryGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedCount = savingsGoals.filter(
    (g) => g.currentAmount >= g.targetAmount,
  ).length;

  const contributeRemaining = contributeGoal
    ? Math.max(0, contributeGoal.targetAmount - contributeGoal.currentAmount)
    : 0;
  const contributeDays = daysUntil(contributeGoal?.deadline);
  const contributeSuggestion =
    contributeGoal && contributeRemaining > 0 && (contributeDays ?? 0) > 0
      ? Math.ceil(
          contributeRemaining /
            Math.max(1, Math.ceil((contributeDays ?? 0) / DAYS_PER_MONTH)),
        )
      : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title leading-tight">Savings Goals</h2>
          {savingsGoals.length > 0 && (
            <p className="text-xs text-white/40 mt-0.5">
              {completedCount} of {savingsGoals.length} completed
            </p>
          )}
        </div>
        <Button
          size="sm"
          icon={<Plus size={16} />}
          onClick={openAdd}
          className="flex-shrink-0"
        >
          <span className="hidden xs:inline">Add Goal</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {savingsGoals.length > 0 && (
        <Card padding="sm" className="space-y-2.5 !p-3 sm:!p-3.5">
          <div className="grid grid-cols-3 gap-x-4">
            <div className="min-w-0">
              <p className="text-[11px] text-white/40 flex items-center gap-1">
                <Banknote size={12} className="text-emerald-400" /> Saved
              </p>
              <p
                className={cn(
                  "text-sm sm:text-base font-bold text-emerald-400 font-mono truncate",
                  blur,
                )}
              >
                {formatCurrency(totalSaved, primaryCurrency)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-white/40 flex items-center gap-1">
                <Target size={12} className="text-blue-400" /> Target
              </p>
              <p
                className={cn(
                  "text-sm sm:text-base font-bold text-white font-mono truncate",
                  blur,
                )}
              >
                {formatCurrency(totalTarget, primaryCurrency)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-white/40 flex items-center gap-1">
                <Check size={12} className="text-violet-400" /> Completed
              </p>
              <p className="text-sm sm:text-base font-bold text-white font-mono">
                {completedCount}
                <span className="text-white/30 font-normal">
                  {" "}
                  / {savingsGoals.length}
                </span>
              </p>
            </div>
          </div>
          <div
            className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(Math.min(totalPct, 100))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall savings progress"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
          {hasMixedCurrencies && (
            <p className="text-[11px] text-white/40">
              Totals include {primaryCurrency} goals only.
            </p>
          )}
        </Card>
      )}

      {savingsGoals.length === 0 ? (
        <Card className="text-center py-10 sm:py-12">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <PiggyBank size={22} className="text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white/80">
            No savings goals yet
          </p>
          <p className="text-xs text-white/40 mt-1 mb-4 max-w-xs mx-auto">
            Set a target and an optional deadline, and see how much to set aside
            each month.
          </p>
          <Button icon={<Plus size={16} />} onClick={openAdd}>
            Create your first goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {sortedGoals.map((g) => {
            const pct =
              g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const isComplete = g.currentAmount >= g.targetAmount;
            const days = daysUntil(g.deadline);
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            const linkedAcc = g.accountId
              ? accounts.find((a) => a.id === g.accountId)
              : null;
            const dayBadge =
              !isComplete && days !== null ? describeDays(days) : null;
            const monthlyNeed =
              !isComplete && days !== null && days > 0
                ? remaining / Math.max(1, Math.ceil(days / DAYS_PER_MONTH))
                : null;

            return (
              <div
                key={g.id}
                className={cn(
                  "glass-card-hover group p-3 flex flex-col gap-2.5",
                  isComplete && "!border-emerald-500/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <GoalRing
                    pct={pct}
                    color={g.color}
                    complete={isComplete}
                    label={`${g.name} savings progress, ${Math.floor(Math.min(pct, 100))}%`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: g.color }}
                      />
                      <p className="text-sm font-semibold text-white truncate">
                        {g.name}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-sm font-bold font-mono mt-0.5 truncate",
                        blur,
                      )}
                      style={{ color: isComplete ? "#34d399" : g.color }}
                    >
                      {formatCurrency(g.currentAmount, g.currency)}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] text-white/40 font-mono truncate",
                        blur,
                      )}
                    >
                      of {formatCurrency(g.targetAmount, g.currency)}
                      {!isComplete && (
                        <> · {formatCurrency(remaining, g.currency)} to go</>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center flex-shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit ${g.name}`}
                      onClick={() => openEdit(g)}
                      className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-white/40 sm:text-white/30 hover:text-blue-400 hover:bg-blue-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:group-hover:text-white/50 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${g.name}`}
                      onClick={() => setConfirmDelete(g.id)}
                      className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-white/40 sm:text-white/30 hover:text-rose-400 hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 sm:group-hover:text-white/50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0 text-[11px]">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-medium">
                        <Check size={11} /> Goal reached
                      </span>
                    ) : (
                      dayBadge && (
                        <span
                          title={
                            g.deadline ? formatDate(g.deadline) : undefined
                          }
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium",
                            dayBadge.tone,
                          )}
                        >
                          <CalendarClock size={11} /> {dayBadge.text}
                        </span>
                      )
                    )}
                    {monthlyNeed !== null && (
                      <span
                        className={cn(
                          "text-white/50 font-mono whitespace-nowrap",
                          blur,
                        )}
                      >
                        Needs {formatCurrency(monthlyNeed, g.currency)}/mo
                      </span>
                    )}
                    {!isComplete && days !== null && days < 0 && (
                      <span className="text-white/40">
                        {formatCurrency(remaining, g.currency)} still needed
                      </span>
                    )}
                    {linkedAcc && (
                      <span className="inline-flex items-center gap-1 text-white/30 truncate">
                        <Landmark size={11} /> {linkedAcc.name}
                      </span>
                    )}
                  </div>
                  {!isComplete && (
                    <button
                      type="button"
                      onClick={() => openContribute(g)}
                      aria-label={`Contribute to ${g.name}`}
                      className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 transition-all"
                      style={{ color: g.color }}
                    >
                      <Plus size={13} /> Add funds
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingGoal ? "Edit Savings Goal" : "New Savings Goal"}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              {editingGoal ? "Save" : "Create"} Goal
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Fund, Vacation"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.targetAmount}
              onChange={(e) =>
                setForm({ ...form, targetAmount: e.target.value })
              }
              error={errors.targetAmount}
            />
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
            <Input
              label="Deadline (optional)"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <Select
              label="Linked Account (optional)"
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              options={[
                { value: "", label: "— None —" },
                ...accounts.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.currency})`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="label-base" id="goal-color-label">
              Color
            </label>
            <div
              className="flex gap-2 flex-wrap"
              role="group"
              aria-labelledby="goal-color-label"
            >
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  aria-pressed={form.color === c}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    form.color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#111827] scale-110"
                      : "opacity-60 hover:opacity-100",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!contributeGoal}
        onClose={closeContribute}
        title={contributeGoal ? `Add to ${contributeGoal.name}` : "Add Funds"}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={closeContribute}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="income"
              onClick={handleContribute}
              className="flex-1"
            >
              Add Funds
            </Button>
          </div>
        }
      >
        {contributeGoal && (
          <div className="space-y-4">
            <p className="text-sm text-white/50">
              <span className={cn("font-mono text-white/80", blur)}>
                {formatCurrency(contributeRemaining, contributeGoal.currency)}
              </span>{" "}
              left to reach your target.
            </p>
            <Input
              label={`Amount (${contributeGoal.currency})`}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={contributeAmount}
              onChange={(e) => {
                setContributeAmount(e.target.value);
                setContributeError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleContribute();
              }}
              error={contributeError}
              autoFocus
            />
            {contributeGoal.accountId && (
              <label className="block space-y-1">
                <span className="label-base !mb-0">Move money from</span>
                <select
                  className="input-base text-sm [&>option]:bg-[#111827]"
                  value={contributeFrom}
                  onChange={(e) => {
                    setContributeFrom(e.target.value);
                    setContributeError("");
                  }}
                >
                  <option value="">Just track it (don't move money)</option>
                  {accounts
                    .filter((a) => a.id !== contributeGoal.accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <span className="text-[11px] text-white/40">
                  Creates a transfer into{" "}
                  {accounts.find((a) => a.id === contributeGoal.accountId)
                    ?.name ?? "the linked account"}
                  .
                </span>
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              {contributeSuggestion > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setContributeAmount(String(contributeSuggestion))
                  }
                  className="px-2.5 py-1 rounded-full text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  Monthly need · {contributeSuggestion.toLocaleString("en-US")}
                </button>
              )}
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setContributeAmount(String(a))}
                  className="px-2.5 py-1 rounded-full text-xs border border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.09] transition-colors"
                >
                  {a.toLocaleString("en-US")}
                </button>
              ))}
              {contributeRemaining > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setContributeAmount(String(contributeRemaining))
                  }
                  className="px-2.5 py-1 rounded-full text-xs border border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.09] transition-colors"
                >
                  Fill remaining
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteSavingsGoal(confirmDelete);
        }}
        title="Delete Savings Goal?"
        message="This will permanently remove this goal and its progress."
      />
    </div>
  );
}
