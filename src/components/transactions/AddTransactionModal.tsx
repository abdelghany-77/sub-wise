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
  AlertTriangle,
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
import {
  todayISO,
  cn,
  getAccountBalanceCurrency,
  getCurrencySymbol,
  convertTransferAmount,
} from "../../lib/utils";

interface FormData {
  type: TransactionType;
  amount: string;
  toAmount: string;
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
  toAmount: "",
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
  const {
    accounts,
    transactions,
    customCategories,
    exchangeRates,
    privacyMode,
    addTransaction,
    updateTransaction,
  } = useStore();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [toAmountEdited, setToAmountEdited] = useState(false);
  const [form, setForm] = useState<FormData>({
    ...DEFAULT_FORM,
    type: initialType,
    accountId: accounts[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const amountInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!editTransaction;

  const customCatsForType = useMemo(
    () =>
      form.type === "transfer"
        ? []
        : customCategories.filter((c) => c.type === form.type),
    [customCategories, form.type],
  );

  const allCategories = useMemo(() => {
    const base = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return Array.from(new Set([...base, ...customCatsForType.map((c) => c.name)]));
  }, [form.type, customCatsForType]);

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

    const combined = Array.from(
      new Set([...sorted, ...customCatsForType.map((c) => c.name), ...allCategories]),
    );
    return combined.slice(0, 6);
  }, [transactions, form.type, customCatsForType, allCategories]);

  useEffect(() => {
    if (editTransaction) {
      setForm({
        type: editTransaction.type,
        amount: String(editTransaction.amount),
        toAmount:
          editTransaction.toAmount !== undefined
            ? String(editTransaction.toAmount)
            : "",
        category: editTransaction.category,
        note: editTransaction.note,
        date: editTransaction.date,
        accountId: editTransaction.accountId,
        toAccountId: editTransaction.toAccountId ?? "",
        isRecurring: editTransaction.isRecurring ?? false,
        recurrenceFrequency: editTransaction.recurrenceFrequency ?? "monthly",
        recurrenceEndDate: editTransaction.recurrenceEndDate ?? "",
      });
      setToAmountEdited(editTransaction.toAmount !== undefined);
      setErrors({});
      setIsOpen(true);
    }
  }, [editTransaction]);

  // Set default category on type change if none selected
  useEffect(() => {
    if (form.type !== "transfer" && !form.category && topCategories.length > 0) {
      setForm((prev) => ({ ...prev, category: topCategories[0] }));
    }
  }, [topCategories, form.category, form.type]);

  // Focus amount input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const destinationAccount = accounts.find((a) => a.id === form.toAccountId);
  const displayCurrency = getAccountBalanceCurrency(selectedAccount);
  const destCurrency = getAccountBalanceCurrency(destinationAccount);
  const isCrossCurrencyTransfer =
    form.type === "transfer" &&
    !!selectedAccount &&
    !!destinationAccount &&
    displayCurrency !== destCurrency;

  // Auto-calculate destination amount for cross-currency transfers unless user customized it
  useEffect(() => {
    if (!isCrossCurrencyTransfer || toAmountEdited) return;
    const amt = Number(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) {
      setForm((prev) => (prev.toAmount ? { ...prev, toAmount: "" } : prev));
      return;
    }
    const converted = convertTransferAmount(
      amt,
      selectedAccount,
      destinationAccount,
      exchangeRates,
    );
    setForm((prev) => ({ ...prev, toAmount: String(converted) }));
  }, [
    isCrossCurrencyTransfer,
    toAmountEdited,
    form.amount,
    selectedAccount,
    destinationAccount,
    exchangeRates,
  ]);

  // Compute available balance for warnings / validation
  const availableBalance = useMemo(() => {
    if (!selectedAccount) return null;
    let available = selectedAccount.balance;
    if (
      isEditMode &&
      editTransaction &&
      editTransaction.accountId === form.accountId &&
      (editTransaction.type === "expense" || editTransaction.type === "transfer")
    ) {
      available += editTransaction.amount;
    }
    return available;
  }, [selectedAccount, isEditMode, editTransaction, form.accountId]);

  const isCreditCardOverBalance =
    (form.type === "expense" || form.type === "transfer") &&
    selectedAccount?.type === "card" &&
    availableBalance !== null &&
    Number(form.amount) > availableBalance;

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
      isCrossCurrencyTransfer &&
      (!form.toAmount || isNaN(Number(form.toAmount)) || Number(form.toAmount) <= 0)
    ) {
      e.toAmount = "Enter a valid destination amount";
    }

    if (
      (form.type === "expense" || form.type === "transfer") &&
      selectedAccount &&
      selectedAccount.type !== "card" &&
      availableBalance !== null &&
      form.amount &&
      !isNaN(Number(form.amount)) &&
      Number(form.amount) > 0 &&
      Number(form.amount) > availableBalance
    ) {
      e.amount = `Insufficient funds (${displayCurrency} ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available)`;
    }

    return e;
  };

  const open = () => {
    setForm({
      ...DEFAULT_FORM,
      type: initialType,
      date: todayISO(),
      accountId: accounts[0]?.id ?? "",
      category: (initialType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0],
    });
    setToAmountEdited(false);
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
      toAmount:
        isCrossCurrencyTransfer && Number(form.toAmount) > 0
          ? Number(form.toAmount)
          : undefined,
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

  const getCategorySwatch = (cat: string) => {
    const custom = customCategories.find((c) => c.name === cat);
    return custom?.color ?? CATEGORY_COLORS[cat] ?? "#3b82f6";
  };

  return (
    <>
      {!isEditMode && !autoOpen && (
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
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
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
                "flex items-center justify-center gap-1.5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all",
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
                "flex items-center justify-center gap-1.5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all",
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
              onClick={() => {
                setToAmountEdited(false);
                setForm({
                  ...form,
                  type: "transfer",
                  category: "Transfer",
                });
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all",
                form.type === "transfer"
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-900/40"
                  : "text-white/50 hover:text-white",
              )}
            >
              <ArrowLeftRight size={15} />
              <span>Transfer</span>
            </button>
          </div>

          {/* 2. Massive Centered Amount Input */}
          <div className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] rounded-3xl p-4 sm:p-5 border border-white/[0.08] text-center relative overflow-hidden">
            <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">
              Amount ({displayCurrency})
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl sm:text-3xl font-extrabold text-white/40">
                {getCurrencySymbol(displayCurrency)}
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
                  "text-3xl sm:text-5xl font-black font-mono tracking-tight tabular-nums bg-transparent text-white text-center focus:outline-none w-full max-w-[240px] placeholder-white/20",
                  form.type === "income"
                    ? "text-emerald-400"
                    : form.type === "expense"
                      ? "text-rose-400"
                      : "text-sky-400",
                )}
              />
            </div>

            {errors.amount && (
              <p className="text-xs text-rose-400 font-medium mt-1.5">
                {errors.amount}
              </p>
            )}
            {!errors.amount && isCreditCardOverBalance && (
              <p className="text-[11px] text-amber-300 font-medium mt-1.5 inline-flex items-center gap-1">
                <AlertTriangle size={12} />
                Exceeds current credit card balance — balance will go negative.
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
                <span
                  className={cn(
                    "text-[11px] text-white/40 font-mono tabular-nums",
                    privacyMode && "privacy-blur",
                  )}
                >
                  Avail: {displayCurrency}{" "}
                  {selectedAccount.balance.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
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
                    onClick={() => {
                      setToAmountEdited(false);
                      setForm({ ...form, accountId: acc.id });
                    }}
                    className={cn(
                      "px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 border",
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
            <div className="space-y-3">
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
                          onClick={() => {
                            setToAmountEdited(false);
                            setForm({ ...form, toAccountId: acc.id });
                          }}
                          className={cn(
                            "px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 border",
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

              {isCrossCurrencyTransfer && (
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="transfer-dest-amount"
                      className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider"
                    >
                      Destination Receives ({destCurrency})
                    </label>
                    <span className="text-[10px] text-white/45">
                      {displayCurrency} → {destCurrency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-sky-300 font-mono">
                      {getCurrencySymbol(destCurrency)}
                    </span>
                    <input
                      id="transfer-dest-amount"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={form.toAmount}
                      onChange={(e) => {
                        setToAmountEdited(true);
                        setForm({ ...form, toAmount: e.target.value });
                        if (errors.toAmount)
                          setErrors({ ...errors, toAmount: undefined });
                      }}
                      placeholder="0.00"
                      className="input-base py-1.5 font-mono font-bold text-sm"
                    />
                  </div>
                  {errors.toAmount && (
                    <p className="text-xs text-rose-400">{errors.toAmount}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Top Most-Used Category Pills */}
          {form.type !== "transfer" && (
            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-blue-400" />
                  <span>Top Categories</span>
                </span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="bg-transparent text-[11px] text-blue-400 font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
                  aria-label="All categories"
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

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {topCategories.map((cat) => {
                  const isSelected = form.category === cat;
                  const catColor = getCategorySwatch(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={cn(
                        "px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-semibold transition-all border",
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
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white min-h-[40px]">
                <Calendar size={14} className="text-white/40 flex-shrink-0" />
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
                className="w-full min-h-[40px] bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 6. Recurring options accordion toggle */}
          <div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isRecurring: !form.isRecurring })}
              className={cn(
                "flex items-center gap-2 text-xs font-medium px-3 py-2 min-h-[38px] rounded-xl transition-all border",
                form.isRecurring
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-white/[0.03] text-white/45 hover:text-white/75 border-white/[0.06]",
              )}
            >
              <Repeat size={13} />
              <span>Make Recurring Commitment</span>
            </button>

            {form.isRecurring && (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
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
                    className="input-base text-xs py-2"
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
                    className="input-base text-xs py-2"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 min-h-[44px]">
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
              className="flex-1 font-bold text-sm py-2.5 min-h-[44px] shadow-lg"
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
