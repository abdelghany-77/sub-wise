import { useState, useEffect } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Repeat,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/FormFields";
import {
  type TransactionType,
  type Transaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "../../types";
import { todayISO } from "../../lib/utils";

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
}

export function AddTransactionModal({
  initialType = "expense",
  editTransaction,
  onClose,
}: Props) {
  const { accounts, addTransaction, updateTransaction } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormData>({
    ...DEFAULT_FORM,
    type: initialType,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const isEditMode = !!editTransaction;

  const categories =
    form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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
        if (
          isEditMode &&
          editTransaction &&
          editTransaction.accountId === form.accountId
        ) {
          if (
            editTransaction.type === "expense" ||
            editTransaction.type === "transfer"
          ) {
            available += editTransaction.amount;
          }
        }
        if (Number(form.amount) > available) {
          e.amount = `Insufficient balance (${sourceAccount.currency} ${available.toFixed(2)} available)`;
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
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
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
      recurrenceFrequency: form.isRecurring
        ? form.recurrenceFrequency
        : undefined,
      recurrenceEndDate:
        form.isRecurring && form.recurrenceEndDate
          ? form.recurrenceEndDate
          : undefined,
    };

    if (isEditMode && editTransaction) {
      updateTransaction(editTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
    handleClose();
  };

  const TYPE_CONFIG = {
    income: {
      label: "Income",
      color: "text-emerald-400",
      icon: <ArrowDownLeft size={16} />,
    },
    expense: {
      label: "Expense",
      color: "text-rose-400",
      icon: <ArrowUpRight size={16} />,
    },
    transfer: {
      label: "Transfer",
      color: "text-sky-400",
      icon: <ArrowLeftRight size={16} />,
    },
  };

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
        title={isEditMode ? "Edit Transaction" : "New Transaction"}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant={
                form.type === "income"
                  ? "income"
                  : form.type === "expense"
                    ? "expense"
                    : "primary"
              }
              className="flex-1"
            >
              {TYPE_CONFIG[form.type].icon}
              {isEditMode ? "Save" : "Add"} {TYPE_CONFIG[form.type].label}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="label-base">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_CONFIG) as TransactionType[]).map((t) => {
                const cfg = TYPE_CONFIG[t];
                const isActive = form.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t, category: "" })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      isActive
                        ? t === "income"
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : t === "expense"
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                            : "bg-sky-500/20 border-sky-500/40 text-sky-400"
                        : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            error={errors.amount}
          />

          {/* Account */}
          <Select
            label={form.type === "transfer" ? "From Account" : "Account"}
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            options={[
              { value: "", label: "— Select account —" },
              ...accounts.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.currency} ${a.balance.toFixed(2)})`,
              })),
            ]}
            error={errors.accountId}
          />

          {/* Transfer To */}
          {form.type === "transfer" && (
            <Select
              label="To Account"
              value={form.toAccountId}
              onChange={(e) =>
                setForm({ ...form, toAccountId: e.target.value })
              }
              options={[
                { value: "", label: "— Select destination —" },
                ...accounts
                  .filter((a) => a.id !== form.accountId)
                  .map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.currency} ${a.balance.toFixed(2)})`,
                  })),
              ]}
              error={errors.toAccountId}
            />
          )}

          {/* Category (not for transfers) */}
          {form.type !== "transfer" && (
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[
                { value: "", label: "— Select category —" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              error={errors.category}
            />
          )}

          {/* Date */}
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          {/* Recurring Toggle */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() =>
                setForm({ ...form, isRecurring: !form.isRecurring })
              }
              className={`flex items-center gap-2.5 w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border ${
                form.isRecurring
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <Repeat size={16} />
              Recurring Transaction
            </button>

            {form.isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                <Select
                  label="Frequency"
                  value={form.recurrenceFrequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrenceFrequency: e.target
                        .value as FormData["recurrenceFrequency"],
                    })
                  }
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                  ]}
                />
                <Input
                  label="End Date (optional)"
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={(e) =>
                    setForm({ ...form, recurrenceEndDate: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          {/* Note */}
          <Textarea
            label="Note (optional)"
            placeholder="Add a description..."
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
      </Modal>
    </>
  );
}
