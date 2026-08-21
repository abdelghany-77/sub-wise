import { useState, useMemo } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/FormFields";
import { formatCurrency, cn } from "../../lib/utils";
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "../../types";
import type { Budget } from "../../types";

const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"];

export function BudgetsPanel() {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget, privacyMode } =
    useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "",
    limit: "",
    currency: "EGP",
    deductFromNetWorth: false,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Current month spending per category
  const monthlySpending = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}-${month}`;

    const map: Record<string, number> = {};
    transactions
      .filter((tx) => tx.type === "expense" && tx.date.startsWith(prefix))
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
      });
    return map;
  }, [transactions]);

  const openAdd = () => {
    setEditingBudget(null);
    setForm({ category: "", limit: "", currency: "EGP", deductFromNetWorth: false });
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
    // Prevent duplicate category budgets
    if (!editingBudget && budgets.some((b) => b.category === form.category)) {
      e.category = "Budget for this category already exists";
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        category: form.category,
        limit: Number(form.limit),
        currency: form.currency,
        deductFromNetWorth: form.deductFromNetWorth,
      });
    } else {
      addBudget({
        category: form.category,
        limit: Number(form.limit),
        currency: form.currency,
        deductFromNetWorth: form.deductFromNetWorth,
      });
    }
    setIsOpen(false);
  };

  const getSpentPercent = (b: Budget) => {
    const spent = monthlySpending[b.category] ?? 0;
    return b.limit > 0 ? (spent / b.limit) * 100 : 0;
  };

  const getBarColor = (pct: number) => {
    if (pct >= 100) return "bg-rose-500";
    if (pct >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Summary stats
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce(
    (s, b) => s + (monthlySpending[b.category] ?? 0),
    0,
  );
  const overBudgetCount = budgets.filter(
    (b) => (monthlySpending[b.category] ?? 0) > b.limit,
  ).length;

  const totalDeductedFromNetWorth = budgets
    .filter((b) => b.deductFromNetWorth)
    .reduce((s, b) => s + b.limit, 0);

  return (
    <div className="space-y-5 pb-24 sm:pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Budgets & Monthly Spending Limits</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Set category limits and track auto-deductions from net worth
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>
          <span className="hidden xs:inline">Add Budget</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Wallet size={18} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/40">Total Budget</p>
            <p className={cn("text-base sm:text-lg font-bold text-white font-mono", privacyMode && "privacy-blur")}>
              {formatCurrency(totalBudget, budgets[0]?.currency)}
            </p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/40">Total Spent</p>
            <p className={cn("text-base sm:text-lg font-bold text-white font-mono", privacyMode && "privacy-blur")}>
              {formatCurrency(totalSpent, budgets[0]?.currency)}
            </p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-rose-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/40">Over Budget</p>
            <p className="text-base sm:text-lg font-bold text-white font-mono">{overBudgetCount}</p>
          </div>
        </Card>
      </div>

      {totalDeductedFromNetWorth > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          <Coins size={16} className="text-blue-400 flex-shrink-0" />
          <span>
            <strong>{formatCurrency(totalDeductedFromNetWorth, budgets[0]?.currency)}</strong> in monthly budgets is committed and auto-deducted from your Net Worth.
          </span>
        </div>
      )}

      {/* Budget items */}
      {budgets.length === 0 ? (
        <Card className="text-center py-16">
          <Wallet size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            No budgets set yet. Add a category limit to start tracking your spending.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {budgets.map((b) => {
            const spent = monthlySpending[b.category] ?? 0;
            const pct = getSpentPercent(b);
            const catColor = CATEGORY_COLORS[b.category] ?? "#94a3b8";

            return (
              <div
                key={b.id}
                className="glass-card-hover group p-4 space-y-3 rounded-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${catColor}20` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: catColor }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">
                          {b.category}
                        </p>
                        {b.deductFromNetWorth && (
                          <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Auto-deducts from Net Worth
                          </span>
                        )}
                      </div>
                      <p className={cn("text-xs text-white/40 font-mono mt-0.5", privacyMode && "privacy-blur")}>
                        {formatCurrency(spent, b.currency)} of{" "}
                        {formatCurrency(b.limit, b.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold font-mono px-2.5 py-1 rounded-full",
                        pct >= 100
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : pct >= 80
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                      )}
                    >
                      {Math.round(pct)}%
                    </span>
                    <button
                      type="button"
                      aria-label="Edit budget"
                      onClick={() => openEdit(b)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete budget"
                      onClick={() => setConfirmDelete(b.id)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.category} budget progress`}>
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getBarColor(pct),
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                {pct >= 100 && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle size={13} />
                    Over budget by {formatCurrency(spent - b.limit, b.currency)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Budget Modal */}
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
            placeholder="0.00"
            value={form.limit}
            onChange={(e) => setForm({ ...form, limit: e.target.value })}
            error={errors.limit}
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />

          {/* Prompt: Will it be spent each month to deduct from Net Worth? */}
          <div className="pt-2 border-t border-white/[0.08]">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={form.deductFromNetWorth}
                onChange={(e) => setForm({ ...form, deductFromNetWorth: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
              />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-white block">
                  Committed Monthly Spend (Auto-deduct from Net Worth)
                </span>
                <span className="text-white/50 block mt-0.5 leading-relaxed">
                  Will this budget be spent each month? Check to automatically subtract this allocation from your Net Worth calculation.
                </span>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) deleteBudget(confirmDelete); }}
        title="Delete Budget?"
        message="This will remove the spending limit for this category."
      />
    </div>
  );
}
