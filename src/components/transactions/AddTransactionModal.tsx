import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/FormFields";
import {
  type TransactionType,
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
}

const DEFAULT_FORM: FormData = {
  type: "expense",
  amount: "",
  category: "",
  note: "",
  date: todayISO(),
  accountId: "",
  toAccountId: "",
};

interface Props {
  initialType?: TransactionType;
}

export function AddTransactionModal({ initialType = "expense" }: Props) {
  const { accounts, addTransaction } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormData>({
    ...DEFAULT_FORM,
    type: initialType,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const categories =
    form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    if (!form.accountId) e.accountId = "Select an account";
    if (form.type !== "transfer" && !form.category)
      e.category = "Select a category";
    if (form.type === "transfer" && !form.toAccountId)
      e.toAccountId = "Select destination account";
    if (form.type === "transfer" && form.accountId === form.toAccountId)
      e.toAccountId = "Source and destination must differ";
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

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    addTransaction({
      type: form.type,
      amount: Number(form.amount),
      category: form.type === "transfer" ? "Transfer" : form.category,
      note: form.note,
      date: form.date,
      accountId: form.accountId,
      toAccountId: form.type === "transfer" ? form.toAccountId : undefined,
    });
    setIsOpen(false);
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
      <Button icon={<Plus size={16} />} onClick={open}>
        <span className="hidden xs:inline">Add Transaction</span>
        <span className="xs:hidden">Add</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="New Transaction"
        size="md"
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

          {/* Note */}
          <Textarea
            label="Note (optional)"
            placeholder="Add a description..."
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
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
              Add {TYPE_CONFIG[form.type].label}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
