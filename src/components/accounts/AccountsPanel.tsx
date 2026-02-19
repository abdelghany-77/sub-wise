import { useState } from "react";
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input, Select } from "../ui/FormFields";
import { formatCurrency, cn } from "../../lib/utils";
import type { Account, AccountType } from "../../types";
import { ACCOUNT_TYPE_LABELS } from "../../types";

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  bank: <Building2 size={18} />,
  wallet: <Wallet size={18} />,
  card: <CreditCard size={18} />,
  savings: <PiggyBank size={18} />,
  investment: <TrendingUp size={18} />,
};

const PRESET_COLORS = [
  "#3b82f6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#3b82f6",
  "#14b8a6",
];

interface AccountFormData {
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  color: string;
}

const DEFAULT_FORM: AccountFormData = {
  name: "",
  type: "bank",
  balance: "",
  currency: "EGP",
  color: "#3b82f6",
};

export function AccountsPanel() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getNetWorthByCurrency,
    privacyMode,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountFormData>(DEFAULT_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<AccountFormData>>({});

  const validate = () => {
    const e: Partial<AccountFormData> = {};
    if (!form.name.trim()) e.name = "Account name is required";
    if (!form.balance || isNaN(Number(form.balance)))
      e.balance = "Enter a valid amount";
    return e;
  };

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditingAccount(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (account: Account) => {
    setForm({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      currency: account.currency,
      color: account.color,
    });
    setEditingAccount(account);
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: form.name,
        type: form.type,
        balance: Number(form.balance),
        currency: form.currency,
        color: form.color,
      });
    } else {
      addAccount({
        name: form.name,
        type: form.type,
        balance: Number(form.balance),
        currency: form.currency,
        color: form.color,
      });
    }
    setShowForm(false);
  };

  const netWorthByCurrency = getNetWorthByCurrency();
  const currencies = Object.keys(netWorthByCurrency);

  return (
    <div className="space-y-6">
      {/* Net Worth Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-transparent border-blue-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_70%)]" />
        <div className="relative">
          <p className="stat-label text-blue-300/60">Total Net Worth</p>
          {currencies.length === 0 ? (
            <p
              className={cn(
                `mt-2 text-3xl sm:text-4xl font-bold font-mono tracking-tight transition-all duration-300 text-gradient-violet`,
                privacyMode && "blur-md select-none",
              )}
            >
              {formatCurrency(0)}
            </p>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2">
              {currencies.map((cur) => {
                const val = netWorthByCurrency[cur];
                return (
                  <p
                    key={cur}
                    className={cn(
                      `text-3xl sm:text-4xl font-bold font-mono tracking-tight transition-all duration-300 ${
                        val >= 0 ? "text-gradient-violet" : "text-gradient-expense"
                      }`,
                      privacyMode && "blur-md select-none",
                    )}
                  >
                    {formatCurrency(val, cur)}
                  </p>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-sm text-white/40">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            {currencies.length > 1 && ` · ${currencies.length} currencies`}
          </p>
        </div>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="section-title">My Accounts</h2>
        <Button icon={<Plus size={16} />} onClick={openAdd} size="sm">
          Add Account
        </Button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card className="text-center py-16">
          <Wallet size={40} className="mx-auto text-white/20 mb-4" />
          <p className="text-white/40 text-sm">
            No accounts yet. Add your first account!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              privacyMode={privacyMode}
              onEdit={() => openEdit(account)}
              onDelete={() => setConfirmDelete(account.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingAccount ? "Edit Account" : "Add New Account"}
      >
        <div className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g. CIB Bank, Cash Wallet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Account Type"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as AccountType })
              }
              options={Object.entries(ACCOUNT_TYPE_LABELS).map(
                ([value, label]) => ({ value, label }),
              )}
            />
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={[
                { value: "EGP", label: "EGP — Egyptian Pound" },
                { value: "USD", label: "USD — US Dollar" },
                { value: "EUR", label: "EUR — Euro" },
                { value: "GBP", label: "GBP — British Pound" },
                { value: "SAR", label: "SAR — Saudi Riyal" },
              ]}
            />
          </div>
          <Input
            label={
              editingAccount ? "Balance (direct edit)" : "Starting Balance"
            }
            type="number"
            placeholder="0.00"
            value={form.balance}
            onChange={(e) => setForm({ ...form, balance: e.target.value })}
            error={errors.balance}
          />
          {/* Color Picker */}
          <div>
            <label className="label-base">Card Color</label>
            <div className="flex gap-2.5 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-8 h-8 rounded-full transition-all duration-200 ring-offset-2 ring-offset-[#131320]"
                  style={{
                    backgroundColor: c,
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined,
                    transform: form.color === c ? "scale(1.2)" : undefined,
                  }}
                  title={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              {editingAccount ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Account?"
        size="sm"
      >
        <p className="text-white/60 text-sm mb-6">
          This will permanently delete the account and all its transactions.
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setConfirmDelete(null)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              if (confirmDelete) {
                deleteAccount(confirmDelete);
                setConfirmDelete(null);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AccountCard({
  account,
  privacyMode,
  onEdit,
  onDelete,
}: {
  account: Account;
  privacyMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="glass-card-hover group relative overflow-hidden p-5"
      style={{ borderColor: `${account.color}22` }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ backgroundColor: account.color }}
      />

      <div className="relative">
        {/* Icon + Actions */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: `${account.color}25`,
              color: account.color,
            }}
          >
            {ACCOUNT_TYPE_ICONS[account.type]}
          </div>
          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="Edit account"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Delete account"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <p className="text-white/50 text-xs uppercase tracking-widest font-medium mb-0.5">
          {ACCOUNT_TYPE_LABELS[account.type]}
        </p>
        <p className="text-white font-semibold text-base truncate">
          {account.name}
        </p>

        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: `${account.color}20` }}
        >
          <p className="text-xs text-white/40 mb-1">Balance</p>
          <p
            className={cn(
              "text-2xl font-bold font-mono transition-all duration-300",
              privacyMode && "blur-md select-none",
            )}
            style={{ color: account.color }}
          >
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
