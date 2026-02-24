import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  Banknote,
  CalendarClock,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/FormFields";
import { formatCurrency, cn } from "../../lib/utils";
import type { SavingsGoal } from "../../types";

const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"];
const GOAL_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f43f5e",
  "#6366f1",
];

export function SavingsGoalsPanel() {
  const {
    savingsGoals,
    accounts,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeSavingsGoal,
  } = useStore();
  const { privacyMode } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currency: "EGP",
    deadline: "",
    accountId: "",
    color: GOAL_COLORS[0],
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const openAdd = () => {
    setEditingGoal(null);
    setForm({
      name: "",
      targetAmount: "",
      currency: "EGP",
      deadline: "",
      accountId: "",
      color: GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)],
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
    if (
      contributeGoalId &&
      contributeAmount &&
      !isNaN(Number(contributeAmount)) &&
      Number(contributeAmount) > 0
    ) {
      contributeSavingsGoal(contributeGoalId, Number(contributeAmount));
      setContributeGoalId(null);
      setContributeAmount("");
    }
  };

  // Summary
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const completedCount = savingsGoals.filter(
    (g) => g.currentAmount >= g.targetAmount,
  ).length;

  const daysUntil = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Savings Goals</h2>
        <Button icon={<Plus size={16} />} onClick={openAdd}>
          <span className="hidden xs:inline">Add Goal</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Target size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Total Target</p>
            <p
              className={cn(
                "text-lg font-bold text-white",
                privacyMode && "blur-md select-none",
              )}
            >
              {formatCurrency(totalTarget, savingsGoals[0]?.currency)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Banknote size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Total Saved</p>
            <p
              className={cn(
                "text-lg font-bold text-white",
                privacyMode && "blur-md select-none",
              )}
            >
              {formatCurrency(totalSaved, savingsGoals[0]?.currency)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Target size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Goals Completed</p>
            <p className="text-lg font-bold text-white">
              {completedCount} / {savingsGoals.length}
            </p>
          </div>
        </Card>
      </div>

      {/* Goal cards */}
      {savingsGoals.length === 0 ? (
        <Card className="text-center py-16">
          <Target size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            No savings goals yet. Set your first goal to start saving.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savingsGoals.map((g) => {
            const pct =
              g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const isComplete = pct >= 100;
            const days = daysUntil(g.deadline);
            const linkedAcc = g.accountId
              ? accounts.find((a) => a.id === g.accountId)
              : null;

            return (
              <div key={g.id} className="glass-card-hover group p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${g.color}20` }}
                    >
                      <Target size={18} style={{ color: g.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {g.name}
                      </p>
                      {linkedAcc && (
                        <p className="text-xs text-white/30">
                          {linkedAcc.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      aria-label="Edit goal"
                      onClick={() => openEdit(g)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete goal"
                      onClick={() => setConfirmDelete(g.id)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Amount + progress */}
                <div>
                  <div className="flex items-baseline justify-between text-sm mb-1.5">
                    <span
                      className={cn(
                        "font-bold",
                        privacyMode && "blur-md select-none",
                      )}
                      style={{ color: g.color }}
                    >
                      {formatCurrency(g.currentAmount, g.currency)}
                    </span>
                    <span
                      className={cn(
                        "text-white/40 text-xs",
                        privacyMode && "blur-md select-none",
                      )}
                    >
                      of {formatCurrency(g.targetAmount, g.currency)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: g.color,
                      }}
                    />
                  </div>
                </div>

                {/* Footer: deadline + contribute */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-white/40 flex items-center gap-1">
                    {isComplete ? (
                      <span className="text-emerald-400 font-medium">
                        Goal reached!
                      </span>
                    ) : days !== null ? (
                      <>
                        <CalendarClock size={12} />
                        {days > 0 ? `${days} days left` : "Past deadline"}
                      </>
                    ) : (
                      <span>{Math.round(pct)}% complete</span>
                    )}
                  </div>
                  {!isComplete && (
                    <button
                      onClick={() => {
                        setContributeGoalId(g.id);
                        setContributeAmount("");
                      }}
                      className="text-xs font-medium px-3 py-1 rounded-lg transition-all hover:bg-white/10"
                      style={{ color: g.color }}
                    >
                      + Contribute
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
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
          <Input
            label="Target Amount"
            type="number"
            placeholder="0.00"
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
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

          {/* Color picker */}
          <div>
            <label className="label-base">Color</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-all",
                    form.color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#131320] scale-110"
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

      {/* Contribute Modal */}
      <Modal
        isOpen={!!contributeGoalId}
        onClose={() => setContributeGoalId(null)}
        title="Contribute to Goal"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setContributeGoalId(null)}
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
        <div className="space-y-4">
          <p className="text-sm text-white/50">
            How much would you like to add to this goal?
          </p>
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
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
              Delete Savings Goal?
            </h3>
            <p className="text-white/50 text-sm mb-6">
              This will permanently remove this goal and its progress.
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
                  deleteSavingsGoal(confirmDelete);
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
