import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Wallet,
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
  const { budgets, transactions, addBudget, updateBudget, deleteBudget } =
    useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "",
    limit: "",
    currency: "EGP",
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
    setForm({ category: "", limit: "", currency: "EGP" });
    setErrors({});
    setIsOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setForm({
      category: b.category,
      limit: String(b.limit),
      currency: b.currency,
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
      });
    } else {
      addBudget({
        category: form.category,
        limit: Number(form.limit),
        currency: form.currency,
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Budgets & Spending Limits</h2>
        <Button icon={<Plus size={16} />} onClick={openAdd}>
          <span className="hidden xs:inline">Add Budget</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Wallet size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Total Budget</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(totalBudget, budgets[0]?.currency)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Total Spent</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(totalSpent, budgets[0]?.currency)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <AlertTriangle size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Over Budget</p>
            <p className="text-lg font-bold text-white">{overBudgetCount}</p>
          </div>
        </Card>
      </div>

      {/* Budget items */}
      {budgets.length === 0 ? (
        <Card className="text-center py-16">
          <Wallet size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            No budgets set yet. Add one to start tracking spending limits.
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
                className="glass-card-hover group p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${catColor}20` }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: catColor }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {b.category}
                      </p>
                      <p className="text-xs text-white/40">
                        {formatCurrency(spent, b.currency)} /{" "}
                        {formatCurrency(b.limit, b.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        pct >= 100
                          ? "bg-rose-500/20 text-rose-400"
                          : pct >= 80
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400",
                      )}
                    >
                      {Math.round(pct)}%
                    </span>
                    <button
                      type="button"
                      aria-label="Edit budget"
                      onClick={() => openEdit(b)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete budget"
                      onClick={() => setConfirmDelete(b.id)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getBarColor(pct),
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                {pct >= 100 && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
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
        </div>
      </Modal>

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
              Delete Budget?
            </h3>
            <p className="text-white/50 text-sm mb-6">
              This will remove the spending limit for this category.
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
                  deleteBudget(confirmDelete);
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
