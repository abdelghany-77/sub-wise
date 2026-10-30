import { useState, useMemo } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Wallet,
  Coins,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/FormFields";
import { formatCurrency, getFinancialCycle, cn } from "../../lib/utils";
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "../../types";
import type { Budget } from "../../types";

const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"];

type SortKey = "risk" | "limit" | "name";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "risk", label: "Most used" },
  { key: "limit", label: "Largest" },
  { key: "name", label: "A–Z" },
];

type Tone = "ok" | "warn" | "over";

const TONES: Record<
  Tone,
  { stroke: string; text: string; bar: string; badge: string }
> = {
  ok: {
    stroke: "stroke-emerald-400",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  warn: {
    stroke: "stroke-amber-400",
    text: "text-amber-400",
    bar: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  over: {
    stroke: "stroke-rose-400",
    text: "text-rose-400",
    bar: "bg-rose-500",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  },
};

const getTone = (pct: number): Tone =>
  pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok";

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function BudgetRing({
  pct,
  tone,
  label: ariaLabel,
}: {
  pct: number;
  tone: Tone;
  label: string;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const label = pct > 999 ? "999+" : `${Math.round(pct)}`;
  return (
    <div
      className="relative w-11 h-11 flex-shrink-0"
      role="img"
      aria-label={ariaLabel}
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
          className={cn("transition-all duration-500", TONES[tone].stroke)}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono",
          TONES[tone].text,
        )}
      >
        {label}%
      </span>
    </div>
  );
}

export function BudgetsPanel() {
  const {
    budgets,
    transactions,
    addBudget,
    updateBudget,
    deleteBudget,
    privacyMode,
    settings,
  } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("risk");
  const [form, setForm] = useState({
    category: "",
    limit: "",
    currency: "EGP",
    deductFromNetWorth: false,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const cycle = useMemo(
    () => getFinancialCycle(new Date(), settings.monthStartsOnDay ?? 1),
    [settings.monthStartsOnDay],
  );

  const monthlySpending = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((tx) => tx.type === "expense" && cycle.isDateInCycle(tx.date))
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
      });
    return map;
  }, [transactions, cycle]);

  const rows = useMemo(() => {
    const list = budgets.map((b) => {
      const spent = monthlySpending[b.category] ?? 0;
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return { budget: b, spent, pct, remaining: b.limit - spent };
    });
    return list.sort((a, b) => {
      if (sortBy === "name")
        return a.budget.category.localeCompare(b.budget.category);
      if (sortBy === "limit") return b.budget.limit - a.budget.limit;
      return b.pct - a.pct;
    });
  }, [budgets, monthlySpending, sortBy]);

  const openAdd = () => {
    setEditingBudget(null);
    setForm({
      category: "",
      limit: "",
      currency: "EGP",
      deductFromNetWorth: false,
    });
    setErrors({});
    setIsOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setForm({
      category: b.category,
      limit: String(b.limit),
      currency: b.currency,
      deductFromNetWorth: b.deductFromNetWorth ?? false,
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const e: Partial<Record<string, string>> = {};
    if (!form.category) e.category = "Select a category";
    if (!form.limit || isNaN(Number(form.limit)) || Number(form.limit) <= 0)
      e.limit = "Enter a valid limit";
    if (
      form.category &&
      budgets.some(
        (b) => b.category === form.category && b.id !== editingBudget?.id,
      )
    ) {
      e.category = "Budget for this category already exists";
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const data = {
      category: form.category,
      limit: Number(form.limit),
      currency: form.currency,
      deductFromNetWorth: form.deductFromNetWorth,
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, data);
    } else {
      addBudget(data);
    }
    setIsOpen(false);
  };

  const primaryCurrency = budgets[0]?.currency ?? "EGP";
  const summaryRows = rows.filter((r) => r.budget.currency === primaryCurrency);
  const hasMixedCurrencies = summaryRows.length !== rows.length;
  const totalBudget = summaryRows.reduce((s, r) => s + r.budget.limit, 0);
  const totalSpent = summaryRows.reduce((s, r) => s + r.spent, 0);
  const totalLeft = totalBudget - totalSpent;
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudgetCount = rows.filter((r) => r.spent > r.budget.limit).length;

  const totalDeductedFromNetWorth = summaryRows
    .filter((r) => r.budget.deductFromNetWorth)
    .reduce((s, r) => s + r.budget.limit, 0);

  const blur = privacyMode && "privacy-blur";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title leading-tight">Budgets</h2>
          <p className="text-xs text-white/40 mt-0.5 truncate">
            <span className="text-blue-300 font-medium font-mono">
              {cycle.cycleLabel}
            </span>{" "}
            · {cycle.remainingDays} {cycle.remainingDays === 1 ? "day" : "days"}{" "}
            left
          </p>
        </div>
        <Button
          size="sm"
          icon={<Plus size={16} />}
          onClick={openAdd}
          className="flex-shrink-0"
        >
          <span className="hidden xs:inline">Add Budget</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {budgets.length > 0 && (
        <Card padding="sm" className="space-y-2.5 !p-3 sm:!p-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="text-[11px] text-white/40">Total Budget</p>
              <p
                className={cn(
                  "text-sm sm:text-base font-bold text-white font-mono truncate",
                  blur,
                )}
              >
                {formatCurrency(totalBudget, primaryCurrency)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-white/40">Spent</p>
              <p
                className={cn(
                  "text-sm sm:text-base font-bold text-white font-mono truncate",
                  blur,
                )}
              >
                {formatCurrency(totalSpent, primaryCurrency)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-white/40">
                {totalLeft < 0 ? "Over by" : "Remaining"}
              </p>
              <p
                className={cn(
                  "text-sm sm:text-base font-bold font-mono truncate",
                  totalLeft < 0 ? "text-rose-400" : "text-emerald-400",
                  blur,
                )}
              >
                {formatCurrency(totalLeft, primaryCurrency)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-white/40">Over Budget</p>
              <p
                className={cn(
                  "text-sm sm:text-base font-bold font-mono flex items-center gap-1.5",
                  overBudgetCount > 0 ? "text-rose-400" : "text-white",
                )}
              >
                {overBudgetCount > 0 && <AlertTriangle size={14} />}
                {overBudgetCount}
                <span className="text-[11px] font-normal text-white/30">
                  of {rows.length}
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
            aria-label="Overall budget used"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                TONES[getTone(totalPct)].bar,
              )}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>

          {(totalDeductedFromNetWorth > 0 || hasMixedCurrencies) && (
            <div className="flex flex-col gap-1 text-[11px] text-white/40">
              {totalDeductedFromNetWorth > 0 && (
                <p className="flex items-center gap-1.5 text-blue-300">
                  <Coins size={12} className="text-blue-400 flex-shrink-0" />
                  <span>
                    <strong className={blur || undefined}>
                      {formatCurrency(
                        totalDeductedFromNetWorth,
                        primaryCurrency,
                      )}
                    </strong>{" "}
                    committed and auto-deducted from Net Worth
                  </span>
                </p>
              )}
              {hasMixedCurrencies && (
                <p>Totals include {primaryCurrency} budgets only.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {budgets.length === 0 ? (
        <Card className="text-center py-10 sm:py-12">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
            <Wallet size={22} className="text-blue-400" />
          </div>
          <p className="text-sm font-medium text-white/80">No budgets yet</p>
          <p className="text-xs text-white/40 mt-1 mb-4 max-w-xs mx-auto">
            Set a limit for a spending category to track how much you have left
            this cycle.
          </p>
          <Button icon={<Plus size={16} />} onClick={openAdd}>
            Create your first budget
          </Button>
        </Card>
      ) : (
        <>
          <div
            className="flex items-center gap-1.5 text-xs"
            role="group"
            aria-label="Sort budgets"
          >
            <span className="text-white/30 mr-1">Sort</span>
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                aria-pressed={sortBy === o.key}
                onClick={() => setSortBy(o.key)}
                className={cn(
                  "px-2.5 py-1 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                  sortBy === o.key
                    ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                    : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.06]",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {rows.map(({ budget: b, spent, pct, remaining }) => {
              const tone = getTone(pct);
              const isOver = spent > b.limit;
              const catColor = CATEGORY_COLORS[b.category] ?? "#94a3b8";
              const perDay =
                !isOver && remaining > 0
                  ? remaining / Math.max(1, cycle.remainingDays)
                  : 0;

              return (
                <div
                  key={b.id}
                  className={cn(
                    "glass-card-hover group p-3 rounded-xl flex items-center gap-3",
                    isOver && "!border-rose-500/30",
                  )}
                >
                  <BudgetRing
                    pct={pct}
                    tone={tone}
                    label={`${b.category} budget, ${Math.round(pct)}% used`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <p className="text-sm font-semibold text-white truncate">
                        {b.category}
                      </p>
                      {b.deductFromNetWorth && (
                        <span
                          title="Auto-deducts from Net Worth"
                          className="flex-shrink-0 text-blue-400"
                        >
                          <Coins
                            size={12}
                            aria-label="Auto-deducts from Net Worth"
                          />
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm font-bold font-mono mt-0.5 truncate",
                        isOver ? "text-rose-400" : "text-white/90",
                        blur,
                      )}
                    >
                      {isOver
                        ? `${formatCurrency(-remaining, b.currency)} over`
                        : `${formatCurrency(remaining, b.currency)} left`}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] text-white/40 font-mono truncate",
                        blur,
                      )}
                    >
                      {formatCurrency(spent, b.currency)} /{" "}
                      {formatCurrency(b.limit, b.currency)}
                      {perDay > 0 && (
                        <> · {formatCurrency(perDay, b.currency)}/day</>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center flex-shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit ${b.category} budget`}
                      onClick={() => openEdit(b)}
                      className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-white/40 sm:text-white/30 hover:text-blue-400 hover:bg-blue-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:group-hover:text-white/50 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${b.category} budget`}
                      onClick={() => setConfirmDelete(b.id)}
                      className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-white/40 sm:text-white/30 hover:text-rose-400 hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 sm:group-hover:text-white/50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingBudget ? "Edit Budget" : "New Budget"}
        size="sm"
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
              {editingBudget ? "Save" : "Add"} Budget
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: "", label: "— Select category —" },
              ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
            error={errors.category}
          />
          <Input
            label="Monthly Limit"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="0.00"
            value={form.limit}
            onChange={(e) => setForm({ ...form, limit: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            error={errors.limit}
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />

          <div className="pt-2 border-t border-white/[0.08]">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={form.deductFromNetWorth}
                onChange={(e) =>
                  setForm({ ...form, deductFromNetWorth: e.target.checked })
                }
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
              />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-white block">
                  Committed Monthly Spend (Auto-deduct from Net Worth)
                </span>
                <span className="text-white/50 block mt-0.5 leading-relaxed">
                  Will this budget be spent each month? Check to automatically
                  subtract this allocation from your Net Worth calculation.
                </span>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteBudget(confirmDelete);
        }}
        title="Delete Budget?"
        message="This will remove the spending limit for this category."
      />
    </div>
  );
}
