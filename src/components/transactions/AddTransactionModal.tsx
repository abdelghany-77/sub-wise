import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Repeat,
  Check,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import {
  type TransactionType,
  type Transaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_COLORS,
} from "../../types";
import { todayISO, cn } from "../../lib/utils";

interface FormData {
  type: TransactionType;
  amount: string;
  category: string;
  note: string;
  date: string;
  accountId: string;
  toAccountId: string;
  isRecurring: boolean;
  recurrenceFrequency: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEndDate: string;
}

const DEFAULT_FORM: FormData = {
  type: "expense",
  amount: "",
  category: "",
  note: "",
  date: todayISO(),
  accountId: "",
  toAccountId: "",
  isRecurring: false,
  recurrenceFrequency: "monthly",
  recurrenceEndDate: "",
};

interface Props {
  initialType?: TransactionType;
  editTransaction?: Transaction | null;
  onClose?: () => void;
  autoOpen?: boolean;
}

export function AddTransactionModal({
  initialType = "expense",
  editTransaction,
  onClose,
  autoOpen = false,
}: Props) {
  const { accounts, transactions, addTransaction, updateTransaction } = useStore();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [form, setForm] = useState<FormData>({
    ...DEFAULT_FORM,
    type: initialType,
    accountId: accounts[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const amountInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!editTransaction;

  // Compute Top 5 most-used categories dynamically
  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === form.type && tx.category && tx.category !== "Transfer") {
        counts[tx.category] = (counts[tx.category] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    const fallbacks = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const combined = Array.from(new Set([...sorted, ...fallbacks]));
    return combined.slice(0, 5);
  }, [transactions, form.type]);

  const allCategories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (editTransaction) {
      setForm({
        type: editTransaction.type,
        amount: String(editTransaction.amount),
        category: editTransaction.category,
        note: editTransaction.note,
        date: editTransaction.date,
        accountId: editTransaction.accountId,
        toAccountId: editTransaction.toAccountId ?? "",
        isRecurring: editTransaction.isRecurring ?? false,
        recurrenceFrequency: editTransaction.recurrenceFrequency ?? "monthly",
        recurrenceEndDate: editTransaction.recurrenceEndDate ?? "",
      });
      setErrors({});
      setIsOpen(true);
    }
  }, [editTransaction]);

  // Set default category on type change if none selected
  useEffect(() => {
    if (!form.category && topCategories.length > 0) {
      setForm((prev) => ({ ...prev, category: topCategories[0] }));
    }
  }, [topCategories, form.category]);

  // Focus amount input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  const validate = () => {
    const e: Partial<Record<string, string>> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    if (!form.accountId) e.accountId = "Select an account";
    if (form.type !== "transfer" && !form.category)
      e.category = "Select a category";
    if (form.type === "transfer" && !form.toAccountId)
      e.toAccountId = "Select destination account";
    if (form.type === "transfer" && form.accountId === form.toAccountId)
      e.toAccountId = "Source and destination must differ";

    if (
      (form.type === "expense" || form.type === "transfer") &&
      form.accountId &&
      form.amount &&
      !isNaN(Number(form.amount)) &&
      Number(form.amount) > 0
    ) {
      const sourceAccount = accounts.find((a) => a.id === form.accountId);
      if (sourceAccount) {
        let available = sourceAccount.balance;
        if (isEditMode && editTransaction && editTransaction.accountId === form.accountId) {
          if (editTransaction.type === "expense" || editTransaction.type === "transfer") {
            available += editTransaction.amount;
          }
        }
        if (Number(form.amount) > available) {
          e.amount = `Insufficient funds (${sourceAccount.currency} ${available.toFixed(2)} available)`;
        }
      }
    }

    return e;
  };

  const open = () => {
    setForm({
      ...DEFAULT_FORM,
      type: initialType,
      accountId: accounts[0]?.id ?? "",
      category: (initialType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0],
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const txData = {
      type: form.type,
      amount: Number(form.amount),
      category: form.type === "transfer" ? "Transfer" : form.category,
      note: form.note,
      date: form.date,
      accountId: form.accountId,
      toAccountId: form.type === "transfer" ? form.toAccountId : undefined,
      isRecurring: form.isRecurring || undefined,
      recurrenceFrequency: form.isRecurring ? form.recurrenceFrequency : undefined,
      recurrenceEndDate:
        form.isRecurring && form.recurrenceEndDate ? form.recurrenceEndDate : undefined,
    };

    if (isEditMode && editTransaction) {
      updateTransaction(editTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
    handleClose();
  };

  const selectedAccount = accounts.find((a) => a.id === form.accountId);

  return (
    <>
      {!isEditMode && (
        <Button icon={<Plus size={16} />} onClick={open}>
          <span className="hidden xs:inline">Add Transaction</span>
          <span className="xs:hidden">Add</span>
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditMode ? "Edit Transaction" : "Quick Add Transaction"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Transaction Type Switcher */}
          <div className="grid grid-cols-3 gap-2 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  type: "expense",
                  category: EXPENSE_CATEGORIES[0],
                })
              }
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                form.type === "expense"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/40"
                  : "text-white/50 hover:text-white",
              )}
            >
              <ArrowUpRight size={15} />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  type: "income",
                  category: INCOME_CATEGORIES[0],
                })
              }
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                form.type === "income"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
                  : "text-white/50 hover:text-white",
              )}
            >
              <ArrowDownLeft size={15} />
              <span>Income</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  type: "transfer",
                  category: "Transfer",
                })
              }
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                form.type === "transfer"
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-900/40"
                  : "text-white/50 hover:text-white",
              )}
            >
              <ArrowLeftRight size={15} />
              <span>Transfer</span>
            </button>
          </div>

          {/* 2. Massive Centered Amount Input (Native Keypad Screen Feel) */}
          <div className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] rounded-3xl p-5 border border-white/[0.08] text-center relative overflow-hidden">
            <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">
              Amount ({selectedAccount?.currency || "EGP"})
            </div>

            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white/40">
                {selectedAccount?.currency === "USD" ? "$" : selectedAccount?.currency === "EUR" ? "€" : "EGP"}
              </span>
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(e) => {
                  setForm({ ...form, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: undefined });
                }}
                className={cn(
                  "text-4xl sm:text-5xl font-black font-mono tracking-tight tabular-nums bg-transparent text-white text-center focus:outline-none w-full max-w-[260px] placeholder-white/20",
                  form.type === "income"
                    ? "text-emerald-400"
                    : form.type === "expense"
                      ? "text-rose-400"
                      : "text-sky-400",
                )}
              />
            </div>

            {errors.amount && (
              <p className="text-xs text-rose-400 font-medium mt-1 animate-pulse">
                {errors.amount}
              </p>
            )}
          </div>

          {/* 3. Quick Account Switcher Horizontal Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                {form.type === "transfer" ? "From Account" : "Account"}
              </span>
              {selectedAccount && (
                <span className="text-[11px] text-white/40 font-mono">
                  Avail: {selectedAccount.currency} {selectedAccount.balance.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {accounts.map((acc) => {
                const isSelected = form.accountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setForm({ ...form, accountId: acc.id })}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 border",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/40"
                        : "bg-white/[0.04] text-white/60 hover:text-white border-white/[0.08]",
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: acc.color }}
                    />
                    <span>{acc.name}</span>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            {errors.accountId && (
              <p className="text-xs text-rose-400 mt-1">{errors.accountId}</p>
            )}
          </div>

          {/* Destination Account for Transfers */}
          {form.type === "transfer" && (
            <div>
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                To Destination Account
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {accounts
                  .filter((a) => a.id !== form.accountId)
                  .map((acc) => {
                    const isSelected = form.toAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setForm({ ...form, toAccountId: acc.id })}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 border",
                          isSelected
                            ? "bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-900/40"
                            : "bg-white/[0.04] text-white/60 hover:text-white border-white/[0.08]",
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: acc.color }}
                        />
                        <span>{acc.name}</span>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </button>
                    );
                  })}
              </div>
              {errors.toAccountId && (
                <p className="text-xs text-rose-400 mt-1">{errors.toAccountId}</p>
              )}
            </div>
          )}

          {/* 4. Top 5 Most-Used Category Pills (Under 3 seconds logging) */}
          {form.type !== "transfer" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-blue-400" />
                  <span>Top Categories</span>
                </span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="bg-transparent text-[11px] text-blue-400 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="" disabled className="bg-[#111827]">
                    More Categories...
                  </option>
                  {allCategories.map((c) => (
                    <option key={c} value={c} className="bg-[#111827] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {topCategories.map((cat) => {
                  const isSelected = form.category === cat;
                  const catColor = CATEGORY_COLORS[cat] || "#3b82f6";
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                        isSelected
                          ? "bg-white text-black border-white shadow-md font-bold"
                          : "bg-white/[0.04] text-white/70 hover:text-white border-white/[0.08]",
                      )}
                      style={{
                        borderColor: isSelected ? catColor : undefined,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              {errors.category && (
                <p className="text-xs text-rose-400 mt-1">{errors.category}</p>
              )}
            </div>
          )}

          {/* 5. Date & Quick Note in compact row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                Date
              </label>
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white">
                <Calendar size={14} className="text-white/40" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-transparent text-white focus:outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch at Arkan, Uber ride"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 6. Recurring options accordion toggle */}
          <div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isRecurring: !form.isRecurring })}
              className={cn(
                "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl transition-all border",
                form.isRecurring
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-white/[0.03] text-white/40 hover:text-white/70 border-white/[0.06]",
              )}
            >
              <Repeat size={13} />
              <span>Make Recurring Commitment</span>
            </button>

            {form.isRecurring && (
              <div className="grid grid-cols-2 gap-3 mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div>
                  <label className="label-base text-[10px]">Frequency</label>
                  <select
                    value={form.recurrenceFrequency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurrenceFrequency: e.target.value as FormData["recurrenceFrequency"],
                      })
                    }
                    className="input-base text-xs py-1.5"
                  >
                    <option value="daily" className="bg-[#111827]">Daily</option>
                    <option value="weekly" className="bg-[#111827]">Weekly</option>
                    <option value="monthly" className="bg-[#111827]">Monthly</option>
                    <option value="yearly" className="bg-[#111827]">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="label-base text-[10px]">End Date</label>
                  <input
                    type="date"
                    value={form.recurrenceEndDate}
                    onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })}
                    className="input-base text-xs py-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={
                form.type === "income"
                  ? "income"
                  : form.type === "expense"
                    ? "expense"
                    : "primary"
              }
              className="flex-1 font-bold text-sm py-2.5 shadow-lg"
            >
              {isEditMode ? "Update" : "Log"}{" "}
              {form.type === "expense" ? "Expense" : form.type === "income" ? "Income" : "Transfer"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
