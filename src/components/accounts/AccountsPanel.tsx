import { useState } from "react";
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  RefreshCw,
  Check,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input, Select } from "../ui/FormFields";
import { formatCurrency, cn } from "../../lib/utils";
import type { Account, AccountType, AssetType, CardBrandTheme } from "../../types";
import {
  ACCOUNT_TYPE_LABELS,
  ASSET_TYPE_LABELS,
  CARD_THEMES,
} from "../../types";

function ContactlessChip({ chipColor = "#F59E0B" }: { chipColor?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="34" height="24" viewBox="0 0 34 24" fill="none" className="drop-shadow">
        <rect width="34" height="24" rx="4" fill={chipColor} fillOpacity="0.9" />
        <rect x="1" y="1" width="32" height="22" rx="3" stroke="#000" strokeOpacity="0.25" strokeWidth="0.8" />
        <path d="M0 8H13V16H0" stroke="#000" strokeOpacity="0.3" strokeWidth="0.8" />
        <path d="M21 8H34V16H21" stroke="#000" strokeOpacity="0.3" strokeWidth="0.8" />
        <path d="M13 12H21" stroke="#000" strokeOpacity="0.3" strokeWidth="0.8" />
        <path d="M13 0V24" stroke="#000" strokeOpacity="0.3" strokeWidth="0.8" />
        <path d="M21 0V24" stroke="#000" strokeOpacity="0.3" strokeWidth="0.8" />
      </svg>
      {/* Contactless waves */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/40 drop-shadow">
        <path d="M8.5 16.5C9.5 15.5 10 14 10 12C10 10 9.5 8.5 8.5 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 19C13.5 17 14.5 14.5 14.5 12C14.5 9.5 13.5 7 12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15.5 21.5C17.5 19 19 15.5 19 12C19 8.5 17.5 5 15.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

interface AccountFormData {
  name: string;
  type: AccountType;
  assetType: AssetType;
  unitBalance: string;
  balance: string;
  currency: string;
  color: string;
  brandTheme: CardBrandTheme;
  accountNumberMasked: string;
}

const DEFAULT_FORM: AccountFormData = {
  name: "",
  type: "bank",
  assetType: "standard",
  unitBalance: "",
  balance: "",
  currency: "EGP",
  color: "#3b82f6",
  brandTheme: "royal_blue",
  accountNumberMasked: "•••• 4829",
};

export function AccountsPanel() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    reconcileAccountBalance,
    getNetWorthBreakdown,
    getAccount30DayNetFlow,
    exchangeRates,
    updateExchangeRates,
    privacyMode,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountFormData>(DEFAULT_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Reconcile modal state
  const [reconcileAccount, setReconcileAccount] = useState<Account | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");

  // Live rates edit modal
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [tempRates, setTempRates] = useState(exchangeRates);

  const breakdown = getNetWorthBreakdown();

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditingAccount(null);
    setShowForm(true);
  };

  const openEdit = (account: Account) => {
    setForm({
      name: account.name,
      type: account.type,
      assetType: account.assetType || "standard",
      unitBalance: account.unitBalance ? String(account.unitBalance) : "",
      balance: String(account.balance),
      currency: account.currency,
      color: account.color,
      brandTheme: account.brandTheme || "royal_blue",
      accountNumberMasked: account.accountNumberMasked || "•••• 4829",
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const openReconcile = (account: Account) => {
    setReconcileAccount(account);
    setActualBalanceInput(String(account.balance));
    setReconcileNote("");
  };

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileAccount) return;
    const actual = parseFloat(actualBalanceInput);
    if (isNaN(actual)) return;

    reconcileAccountBalance(
      reconcileAccount.id,
      actual,
      reconcileNote || "Balance Reconciliation / تسوية رصيد",
    );
    setReconcileAccount(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    let exchangeRate = 1;
    if (form.assetType === "gold_24k") exchangeRate = exchangeRates.GOLD_24K || 4200;
    else if (form.assetType === "gold_21k") exchangeRate = exchangeRates.GOLD_21K || 3675;
    else if (form.currency === "USD") exchangeRate = exchangeRates.USD || 50;
    else if (form.currency === "EUR") exchangeRate = exchangeRates.EUR || 54;
    else if (form.currency === "SAR") exchangeRate = exchangeRates.SAR || 13.3;

    const unitBal = parseFloat(form.unitBalance);
    const regularBal = parseFloat(form.balance);

    const calculatedBalance =
      form.assetType !== "standard" && !isNaN(unitBal)
        ? unitBal * exchangeRate
        : isNaN(regularBal)
          ? 0
          : regularBal;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: form.name,
        type: form.type,
        assetType: form.assetType,
        unitBalance: isNaN(unitBal) ? undefined : unitBal,
        exchangeRateToBase: form.assetType !== "standard" ? exchangeRate : undefined,
        balance: calculatedBalance,
        currency: form.currency,
        color: form.color,
        brandTheme: form.brandTheme,
        accountNumberMasked: form.accountNumberMasked,
      });
    } else {
      addAccount({
        name: form.name,
        type: form.type,
        assetType: form.assetType,
        unitBalance: isNaN(unitBal) ? undefined : unitBal,
        exchangeRateToBase: form.assetType !== "standard" ? exchangeRate : undefined,
        balance: calculatedBalance,
        currency: form.currency,
        color: form.color,
        brandTheme: form.brandTheme,
        accountNumberMasked: form.accountNumberMasked,
      });
    }
    setShowForm(false);
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateExchangeRates(tempRates);
    setShowRatesModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Multi-Currency & Gold Live Rates Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0C121E] via-[#101827] to-[#0C121E] border border-white/[0.08] p-3.5 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
            <Coins size={16} />
          </div>
          <div>
            <span className="text-xs font-semibold text-white tracking-wide block">
              Live Asset Vault & FX Rates
            </span>
            <span className="text-[10px] text-white/40">Base currency conversion in EGP</span>
          </div>
        </div>

        {/* Rates chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5 font-mono">
            <span className="text-white/40 text-[10px]">USD:</span>
            <span className="font-bold text-white tabular-nums">{exchangeRates.USD} EGP</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5 font-mono">
            <span className="text-white/40 text-[10px]">EUR:</span>
            <span className="font-bold text-white tabular-nums">{exchangeRates.EUR} EGP</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5 font-mono">
            <span className="text-amber-400 text-[10px]">Gold 24K:</span>
            <span className="font-bold text-amber-300 tabular-nums">{exchangeRates.GOLD_24K} EGP/g</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5 font-mono hidden sm:flex">
            <span className="text-amber-400/80 text-[10px]">Gold 21K:</span>
            <span className="font-bold text-amber-300/90 tabular-nums">{exchangeRates.GOLD_21K} EGP/g</span>
          </div>

          <button
            onClick={() => {
              setTempRates(exchangeRates);
              setShowRatesModal(true);
            }}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Edit live conversion rates"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Net Worth & Assets Allocation Breakdown Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Net Worth */}
        <Card className="p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-transparent border-blue-500/25">
          <div className="flex items-center justify-between">
            <span className="stat-label text-blue-300/80">Total Net Worth</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Total EGP
            </span>
          </div>
          <p
            className={cn(
              "stat-value text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight",
              privacyMode && "privacy-blur",
            )}
          >
            {formatCurrency(breakdown.totalNetWorth, "EGP")}
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            Accounts + Gold/FX + Receivables - Debts
          </p>
        </Card>

        {/* Liquid Cash vs Hard Assets Badge */}
        <Card className="p-4 sm:p-5 relative overflow-hidden">
          <span className="stat-label">Asset Allocation</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
              <span className="text-[10px] text-blue-400 font-medium uppercase block">Liquid Cash</span>
              <span
                className={cn(
                  "text-base font-bold font-mono text-white tabular-nums",
                  privacyMode && "privacy-blur",
                )}
              >
                {formatCurrency(breakdown.liquidCash, "EGP")}
              </span>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
              <span className="text-[10px] text-amber-400 font-medium uppercase block">Hard Assets/Gold</span>
              <span
                className={cn(
                  "text-base font-bold font-mono text-amber-300 tabular-nums",
                  privacyMode && "privacy-blur",
                )}
              >
                {formatCurrency(breakdown.hardAssets, "EGP")}
              </span>
            </div>
          </div>
        </Card>

        {/* External Position (Receivables & Payables) */}
        <Card className="p-4 sm:p-5 relative overflow-hidden">
          <span className="stat-label">External Position</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
              <span className="text-[10px] text-emerald-400 font-medium uppercase block">Owed to you</span>
              <span
                className={cn(
                  "text-base font-bold font-mono text-emerald-400 tabular-nums",
                  privacyMode && "privacy-blur",
                )}
              >
                +{formatCurrency(breakdown.receivables, "EGP")}
              </span>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
              <span className="text-[10px] text-rose-400 font-medium uppercase block">You Owe Others</span>
              <span
                className={cn(
                  "text-base font-bold font-mono text-rose-400 tabular-nums",
                  privacyMode && "privacy-blur",
                )}
              >
                -{formatCurrency(breakdown.payables, "EGP")}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title text-base sm:text-lg">Bank Cards & Wallet Vault</h2>
          <p className="text-xs text-white/40">
            Skeuomorphic digital representations with 30-day net flow and direct balance adjustment
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
          Add Account / Asset
        </Button>
      </div>

      {/* Skeuomorphic Bank & Wallet Cards Grid */}
      {accounts.length === 0 ? (
        <Card className="text-center py-16">
          <Wallet size={40} className="mx-auto text-white/20 mb-4" />
          <p className="text-white/40 text-sm">No accounts yet. Add your first bank account or wallet!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {accounts.map((account) => {
            const themeKey = (account.brandTheme || "royal_blue") as CardBrandTheme;
            const theme = CARD_THEMES[themeKey] || CARD_THEMES.royal_blue;
            const netFlow = getAccount30DayNetFlow(account.id);

            return (
              <div
                key={account.id}
                className={cn(
                  "relative rounded-3xl p-5 sm:p-6 overflow-hidden transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between min-h-[210px] border border-white/15 bg-gradient-to-tr",
                  theme.gradient,
                )}
                style={{
                  boxShadow: `0 10px 30px -10px ${theme.glow}`,
                }}
              >
                {/* Subtle skeuomorphic card shine overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.22),transparent_60%)] pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/[0.03] pointer-events-none blur-xl" />

                {/* Top Card Row: EMV Chip, Contactless Symbol & Quick Actions */}
                <div className="relative z-10 flex items-start justify-between">
                  <ContactlessChip chipColor={theme.chipColor} />

                  <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Adjust Balance Action Button */}
                    <button
                      onClick={() => openReconcile(account)}
                      className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/20 text-[11px] font-semibold flex items-center gap-1 transition-all backdrop-blur-sm"
                      title="Adjust actual real balance"
                    >
                      <Scale size={12} />
                      <span>Adjust</span>
                    </button>

                    <button
                      onClick={() => openEdit(account)}
                      className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white/70 hover:text-white border border-white/10 transition-colors"
                      title="Edit Account Details"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      onClick={() => setConfirmDelete(account.id)}
                      className="p-1.5 rounded-xl bg-black/30 hover:bg-rose-900/50 text-white/70 hover:text-rose-300 border border-white/10 transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Middle Card Row: Masked Card Number */}
                <div className="relative z-10 my-3">
                  <span className="font-mono text-sm sm:text-base tracking-[0.2em] text-white/80 drop-shadow">
                    {account.accountNumberMasked || "•••• •••• •••• 4829"}
                  </span>
                </div>

                {/* Bottom Card Row: Balance & Account Details */}
                <div className="relative z-10 pt-3 border-t border-white/10 flex items-end justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
                      {account.name}
                    </span>
                    <span
                      className={cn(
                        "text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums text-white drop-shadow",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {formatCurrency(account.balance, account.currency)}
                    </span>

                    {/* Unit balance subtitle if foreign/gold */}
                    {account.unitBalance !== undefined && account.assetType !== "standard" && (
                      <span className="text-[10px] text-amber-200 font-mono block">
                        Vault: {account.unitBalance} {account.assetType?.includes("gold") ? "Grams" : account.currency}
                      </span>
                    )}
                  </div>

                  {/* 30-Day Mini Net-Flow Indicator */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[9px] text-white/50 block font-medium uppercase">30D Net Flow</span>
                    <div
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full border backdrop-blur-md",
                        netFlow >= 0
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-400/30",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {netFlow >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                      <span>
                        {netFlow >= 0 ? "+" : ""}
                        {formatCurrency(netFlow, account.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adjust Balance Reconciliation Modal */}
      {reconcileAccount && (
        <Modal
          isOpen={!!reconcileAccount}
          onClose={() => setReconcileAccount(null)}
          title={`Adjust Real Balance · ${reconcileAccount.name}`}
        >
          <form onSubmit={handleReconcileSubmit} className="space-y-4">
            <p className="text-xs text-white/60">
              Enter the exact balance currently shown in your real bank app or wallet. Walleteer will automatically calculate the discrepancy and log a system reconciliation transaction.
            </p>

            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs font-mono">
              <span className="text-white/50">Recorded Balance:</span>
              <span className="font-bold text-white">
                {formatCurrency(reconcileAccount.balance, reconcileAccount.currency)}
              </span>
            </div>

            <div>
              <label className="label-base">Actual Current Balance</label>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={actualBalanceInput}
                onChange={(e) => setActualBalanceInput(e.target.value)}
                className="input-base text-lg font-bold font-mono"
              />
            </div>

            {/* Live Difference preview */}
            {actualBalanceInput && !isNaN(parseFloat(actualBalanceInput)) && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
                <span className="text-blue-300">Adjustment Difference:</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    parseFloat(actualBalanceInput) - reconcileAccount.balance >= 0
                      ? "text-emerald-400"
                      : "text-rose-400",
                  )}
                >
                  {parseFloat(actualBalanceInput) - reconcileAccount.balance >= 0 ? "+" : ""}
                  {(parseFloat(actualBalanceInput) - reconcileAccount.balance).toFixed(2)}{" "}
                  {reconcileAccount.currency}
                </span>
              </div>
            )}

            <div>
              <label className="label-base">Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Month-end bank statement sync"
                value={reconcileNote}
                onChange={(e) => setReconcileNote(e.target.value)}
                className="input-base"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Button type="button" variant="ghost" onClick={() => setReconcileAccount(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                Apply & Reconcile
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Account Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingAccount ? "Edit Account / Asset" : "Add Bank Card or Asset"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Account / Asset Name"
            placeholder="e.g. CIB Wealth, Vodafone Cash, 24K Gold Bullion"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Account Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}
              options={Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />

            <Select
              label="Asset Vault Category"
              value={form.assetType}
              onChange={(e) => {
                const val = e.target.value as AssetType;
                let cur = form.currency;
                if (val === "gold_24k" || val === "gold_21k") cur = "EGP";
                setForm({ ...form, assetType: val, currency: cur });
              }}
              options={Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>

          {/* Unit Balance vs Regular Balance */}
          {form.assetType !== "standard" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div>
                <label className="label-base text-amber-200">
                  {form.assetType.includes("gold") ? "Gold Weight (Grams)" : "Units in Foreign Currency"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 10 for 10g Gold, 500 for $500"
                  value={form.unitBalance}
                  onChange={(e) => setForm({ ...form, unitBalance: e.target.value })}
                  className="input-base font-mono font-bold"
                />
              </div>

              <div>
                <label className="label-base text-amber-200">Currency / Unit</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="input-base"
                >
                  <option value="EGP" className="bg-[#111827]">EGP (Gold Grams)</option>
                  <option value="USD" className="bg-[#111827]">USD ($)</option>
                  <option value="EUR" className="bg-[#111827]">EUR (€)</option>
                  <option value="SAR" className="bg-[#111827]">SAR (ر.س)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={editingAccount ? "Current Balance" : "Starting Balance"}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                required
              />

              <Select
                label="Currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                options={[
                  { value: "EGP", label: "EGP — Egyptian Pound" },
                  { value: "USD", label: "USD — US Dollar" },
                  { value: "EUR", label: "EUR — Euro" },
                  { value: "SAR", label: "SAR — Saudi Riyal" },
                ]}
              />
            </div>
          )}

          {/* Skeuomorphic Brand Theme Selector */}
          <div>
            <label className="label-base">Skeuomorphic Card Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {Object.values(CARD_THEMES).map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setForm({ ...form, brandTheme: theme.id })}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all bg-gradient-to-r",
                    theme.gradient,
                    form.brandTheme === theme.id ? "ring-2 ring-white border-white" : "border-white/10 opacity-70 hover:opacity-100",
                  )}
                >
                  <span className="truncate text-white">{theme.name}</span>
                  {form.brandTheme === theme.id && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Masked Card Number */}
          <div>
            <label className="label-base">Masked Number / Label on Card</label>
            <input
              type="text"
              placeholder="e.g. •••• 4829 or 010 •••• 9102"
              value={form.accountNumberMasked}
              onChange={(e) => setForm({ ...form, accountNumberMasked: e.target.value })}
              className="input-base font-mono"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-white/[0.08]">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">
              {editingAccount ? "Save Changes" : "Create Card"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Live FX Rates Edit Modal */}
      {showRatesModal && (
        <Modal
          isOpen={showRatesModal}
          onClose={() => setShowRatesModal(false)}
          title="Update Live FX & Gold Exchange Rates"
        >
          <form onSubmit={handleSaveRates} className="space-y-4">
            <p className="text-xs text-white/60">
              Set the conversion rates to Egyptian Pound (EGP). All foreign currencies and gold assets will recalculate their net worth in real-time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">USD to EGP</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempRates.USD}
                  onChange={(e) => setTempRates({ ...tempRates, USD: parseFloat(e.target.value) || 0 })}
                  className="input-base font-mono font-bold"
                />
              </div>

              <div>
                <label className="label-base">EUR to EGP</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempRates.EUR}
                  onChange={(e) => setTempRates({ ...tempRates, EUR: parseFloat(e.target.value) || 0 })}
                  className="input-base font-mono font-bold"
                />
              </div>

              <div>
                <label className="label-base">SAR to EGP</label>
                <input
                  type="number"
                  step="0.05"
                  value={tempRates.SAR}
                  onChange={(e) => setTempRates({ ...tempRates, SAR: parseFloat(e.target.value) || 0 })}
                  className="input-base font-mono font-bold"
                />
              </div>

              <div>
                <label className="label-base">Gold 24K (EGP/Gram)</label>
                <input
                  type="number"
                  step="10"
                  value={tempRates.GOLD_24K}
                  onChange={(e) => setTempRates({ ...tempRates, GOLD_24K: parseFloat(e.target.value) || 0 })}
                  className="input-base font-mono font-bold"
                />
              </div>

              <div>
                <label className="label-base">Gold 21K (EGP/Gram)</label>
                <input
                  type="number"
                  step="10"
                  value={tempRates.GOLD_21K}
                  onChange={(e) => setTempRates({ ...tempRates, GOLD_21K: parseFloat(e.target.value) || 0 })}
                  className="input-base font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Button variant="ghost" onClick={() => setShowRatesModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                Update Rates
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <Modal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          title="Delete Account?"
          size="sm"
        >
          <p className="text-white/60 text-sm mb-6">
            This will permanently delete the account and all associated transactions. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                deleteAccount(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
