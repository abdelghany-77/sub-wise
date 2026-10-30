import { useState } from "react";
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Coins,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input, Select } from "../ui/FormFields";
import { formatCurrency, cn } from "../../lib/utils";
import type {
  Account,
  AccountType,
  AssetType,
  CardBrandTheme,
} from "../../types";
import {
  ACCOUNT_TYPE_LABELS,
  ASSET_TYPE_LABELS,
  CARD_THEMES,
} from "../../types";

function ContactlessChip({ chipColor = "#F59E0B" }: { chipColor?: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <svg
        width="30"
        height="21"
        viewBox="0 0 34 24"
        fill="none"
        className="drop-shadow"
      >
        <rect
          width="34"
          height="24"
          rx="4"
          fill={chipColor}
          fillOpacity="0.9"
        />
        <rect
          x="1"
          y="1"
          width="32"
          height="22"
          rx="3"
          stroke="#000"
          strokeOpacity="0.25"
          strokeWidth="0.8"
        />
        <path
          d="M0 8H13V16H0"
          stroke="#000"
          strokeOpacity="0.3"
          strokeWidth="0.8"
        />
        <path
          d="M21 8H34V16H21"
          stroke="#000"
          strokeOpacity="0.3"
          strokeWidth="0.8"
        />
        <path
          d="M13 12H21"
          stroke="#000"
          strokeOpacity="0.3"
          strokeWidth="0.8"
        />
        <path
          d="M13 0V24"
          stroke="#000"
          strokeOpacity="0.3"
          strokeWidth="0.8"
        />
        <path
          d="M21 0V24"
          stroke="#000"
          strokeOpacity="0.3"
          strokeWidth="0.8"
        />
      </svg>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        className="text-white/50 drop-shadow"
      >
        <path
          d="M8.5 16.5C9.5 15.5 10 14 10 12C10 10 9.5 8.5 8.5 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 19C13.5 17 14.5 14.5 14.5 12C14.5 9.5 13.5 7 12 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15.5 21.5C17.5 19 19 15.5 19 12C19 8.5 17.5 5 15.5 2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
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
  accountNumberMasked: "",
};

const FOREIGN_CURRENCIES = ["USD", "EUR", "SAR"];

const RATE_FIELDS = [
  { key: "USD", label: "USD to EGP", step: "0.1" },
  { key: "EUR", label: "EUR to EGP", step: "0.1" },
  { key: "SAR", label: "SAR to EGP", step: "0.05" },
  { key: "GOLD_24K", label: "Gold 24K (EGP/Gram)", step: "10" },
  { key: "GOLD_21K", label: "Gold 21K (EGP/Gram)", step: "10" },
] as const;

const PRIMARY_BTN = "bg-blue-600 hover:bg-blue-500 text-white";

const iconBtn =
  "p-2 sm:p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-colors";

/** Non-standard assets (gold / FX) store `balance` as the EGP-converted value. */
function getDisplayCurrency(account: Account) {
  return account.assetType && account.assetType !== "standard"
    ? "EGP"
    : account.currency;
}

function SummaryTile({
  label,
  value,
  tone,
  privacyMode,
}: {
  label: string;
  value: string;
  tone: string;
  privacyMode: boolean;
}) {
  return (
    <div className="bg-white/[0.03] px-2.5 py-2 rounded-xl border border-white/[0.06] min-w-0">
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wide block truncate",
          tone,
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-bold font-mono text-white tabular-nums block truncate",
          privacyMode && "privacy-blur",
        )}
      >
        {value}
      </span>
    </div>
  );
}

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
  const [typeFilter, setTypeFilter] = useState<"all" | AccountType>("all");

  // Reconcile modal state
  const [reconcileAccount, setReconcileAccount] = useState<Account | null>(
    null,
  );
  const [actualBalanceInput, setActualBalanceInput] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");

  // Live rates edit modal
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [tempRates, setTempRates] = useState(exchangeRates);

  const breakdown = getNetWorthBreakdown();
  const totalAssets = breakdown.liquidCash + breakdown.hardAssets;

  const typeCounts = accounts.reduce<Partial<Record<AccountType, number>>>(
    (acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const typeKeys = Object.keys(typeCounts) as AccountType[];
  const activeFilter =
    typeFilter !== "all" && !typeCounts[typeFilter] ? "all" : typeFilter;
  const visibleAccounts =
    activeFilter === "all"
      ? accounts
      : accounts.filter((a) => a.type === activeFilter);

  const accountToDelete = confirmDelete
    ? accounts.find((a) => a.id === confirmDelete)
    : undefined;

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
      accountNumberMasked: account.accountNumberMasked ?? "",
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const openReconcile = (account: Account) => {
    setReconcileAccount(account);
    setActualBalanceInput(String(account.balance));
    setReconcileNote("");
  };

  const openRates = () => {
    setTempRates(exchangeRates);
    setShowRatesModal(true);
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

    const isStandard = form.assetType === "standard";
    const currency =
      form.assetType === "foreign_currency" &&
      !FOREIGN_CURRENCIES.includes(form.currency)
        ? "USD"
        : form.currency;

    let exchangeRate = 1;
    if (form.assetType === "gold_24k")
      exchangeRate = exchangeRates.GOLD_24K || 4200;
    else if (form.assetType === "gold_21k")
      exchangeRate = exchangeRates.GOLD_21K || 3675;
    else if (currency === "USD") exchangeRate = exchangeRates.USD || 50;
    else if (currency === "EUR") exchangeRate = exchangeRates.EUR || 54;
    else if (currency === "SAR") exchangeRate = exchangeRates.SAR || 13.3;

    const unitBal = parseFloat(form.unitBalance);
    const regularBal = parseFloat(form.balance);

    const calculatedBalance =
      !isStandard && !isNaN(unitBal)
        ? unitBal * exchangeRate
        : isNaN(regularBal)
          ? 0
          : regularBal;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      assetType: form.assetType,
      unitBalance: isStandard || isNaN(unitBal) ? undefined : unitBal,
      exchangeRateToBase: isStandard ? undefined : exchangeRate,
      balance: calculatedBalance,
      currency,
      color: form.color,
      brandTheme: form.brandTheme,
      accountNumberMasked: form.accountNumberMasked,
    };

    if (editingAccount) {
      updateAccount(editingAccount.id, payload);
    } else {
      addAccount(payload);
    }
    setShowForm(false);
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateExchangeRates(tempRates);
    setShowRatesModal(false);
  };

  const actualParsed = parseFloat(actualBalanceInput);
  const reconcileDiff =
    reconcileAccount && !isNaN(actualParsed)
      ? actualParsed - reconcileAccount.balance
      : null;
  const reconcileCurrency = reconcileAccount
    ? getDisplayCurrency(reconcileAccount)
    : "EGP";

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Net worth banner */}
      <Card className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] gap-3 lg:gap-5 items-center bg-gradient-to-br from-blue-900/25 via-indigo-900/10 to-transparent border-blue-500/20">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label text-blue-300/80">Total Net Worth</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              EGP
            </span>
          </div>
          <p
            className={cn(
              "stat-value text-2xl sm:text-3xl font-extrabold text-white mt-1 truncate",
              privacyMode && "privacy-blur",
            )}
          >
            {breakdown.totalNetWorth < 0 ? "-" : ""}
            {formatCurrency(breakdown.totalNetWorth, "EGP")}
          </p>
          <p className="text-[11px] text-white/50 mt-0.5">
            Accounts + assets + receivables − debts
            {breakdown.committedBudgets > 0 && (
              <span className={cn(privacyMode && "privacy-blur")}>
                {" "}
                − {formatCurrency(breakdown.committedBudgets, "EGP")} committed
                budgets
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <SummaryTile
            label="Liquid Cash"
            value={formatCurrency(breakdown.liquidCash, "EGP")}
            tone="text-blue-300"
            privacyMode={privacyMode}
          />
          <SummaryTile
            label="Hard Assets / Gold"
            value={formatCurrency(breakdown.hardAssets, "EGP")}
            tone="text-amber-300"
            privacyMode={privacyMode}
          />
          <SummaryTile
            label="Owed to you"
            value={`+${formatCurrency(breakdown.receivables, "EGP")}`}
            tone="text-emerald-400"
            privacyMode={privacyMode}
          />
          <SummaryTile
            label="You owe"
            value={`-${formatCurrency(breakdown.payables, "EGP")}`}
            tone="text-rose-400"
            privacyMode={privacyMode}
          />
        </div>
      </Card>

      {/* Header and actions */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="section-title text-base sm:text-lg leading-tight">
            Bank Cards & Wallet Vault
          </h2>
          <p className="text-xs text-white/50">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"} ·
            30-day net flow · quick balance adjustment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Coins size={15} />}
            onClick={openRates}
            title="Update FX & gold rates"
          >
            <span className="hidden sm:inline">FX & Gold Rates</span>
            <span className="sm:hidden">Rates</span>
          </Button>
          <Button
            icon={<Plus size={16} />}
            onClick={openAdd}
            size="sm"
            className={PRIMARY_BTN}
          >
            Add Account
          </Button>
        </div>
      </div>

      {/* Type filter chips */}
      {typeKeys.length > 1 && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5"
          role="group"
          aria-label="Filter accounts by type"
        >
          {(["all", ...typeKeys] as const).map((key) => {
            const isActive = activeFilter === key;
            const count = key === "all" ? accounts.length : typeCounts[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setTypeFilter(key)}
                className={cn(
                  "flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                  isActive
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                    : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08]",
                )}
              >
                {key === "all" ? "All" : ACCOUNT_TYPE_LABELS[key]}
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    isActive ? "text-blue-200/80" : "text-white/50",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Skeuomorphic Bank & Wallet Cards Grid */}
      {accounts.length === 0 ? (
        <Card className="text-center py-10 sm:py-12">
          <Wallet size={36} className="mx-auto text-white/25 mb-3" />
          <p className="text-white/80 text-sm font-medium">No accounts yet</p>
          <p className="text-white/50 text-xs mt-1 mb-4">
            Add your first bank account, wallet or gold vault to start tracking.
          </p>
          <Button
            icon={<Plus size={16} />}
            onClick={openAdd}
            size="sm"
            className={PRIMARY_BTN}
          >
            Add Account
          </Button>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleAccounts.map((account) => {
            const themeKey = (account.brandTheme ||
              "royal_blue") as CardBrandTheme;
            const theme = CARD_THEMES[themeKey] || CARD_THEMES.royal_blue;
            const netFlow = getAccount30DayNetFlow(account.id);
            const displayCurrency = getDisplayCurrency(account);
            const share =
              totalAssets > 0
                ? Math.min(
                    100,
                    (Math.max(0, account.balance) / totalAssets) * 100,
                  )
                : 0;

            return (
              <li
                key={account.id}
                className={cn(
                  "group relative rounded-2xl p-3.5 sm:p-4 overflow-hidden transition-all duration-300 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-xl flex flex-col gap-2.5 border border-white/15 bg-gradient-to-tr",
                  theme.gradient,
                )}
                style={{
                  boxShadow: `0 8px 24px -10px ${theme.glow}`,
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.22),transparent_60%)] pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/[0.03] pointer-events-none blur-xl" />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <ContactlessChip chipColor={theme.chipColor} />

                  <div className="flex items-center bg-black/40 backdrop-blur-md rounded-xl p-0.5 border border-white/15 shadow-sm opacity-100 sm:opacity-60 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openReconcile(account)}
                      className={iconBtn}
                      title="Adjust / reconcile real balance"
                      aria-label={`Reconcile balance of ${account.name}`}
                    >
                      <Scale size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(account)}
                      className={iconBtn}
                      title="Edit account details"
                      aria-label={`Edit ${account.name}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(account.id)}
                      className={cn(
                        iconBtn,
                        "hover:bg-rose-500/25 hover:text-rose-300",
                      )}
                      title="Delete account"
                      aria-label={`Delete ${account.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="relative z-10 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className="text-sm font-semibold text-white truncate drop-shadow"
                      title={account.name}
                    >
                      {account.name}
                    </h3>
                    <span className="flex-shrink-0 px-1.5 py-px rounded-md text-[9px] font-semibold uppercase tracking-wide bg-black/25 text-white/80 border border-white/15">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </span>
                  </div>
                  <span className="font-mono text-xs tracking-[0.15em] text-white/70 drop-shadow block truncate">
                    {account.accountNumberMasked || "•••• ••••"}
                  </span>
                </div>

                <div className="relative z-10 pt-2.5 border-t border-white/15 flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "text-xl font-black font-mono tracking-tight tabular-nums text-white drop-shadow block truncate",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {account.balance < 0 ? "-" : ""}
                      {formatCurrency(account.balance, displayCurrency)}
                    </span>
                    {account.unitBalance !== undefined &&
                      account.assetType !== "standard" && (
                        <span
                          className={cn(
                            "text-[10px] text-amber-200 font-mono block",
                            privacyMode && "privacy-blur",
                          )}
                        >
                          Vault: {account.unitBalance}{" "}
                          {account.assetType?.includes("gold")
                            ? "g"
                            : account.currency}
                        </span>
                      )}
                  </div>

                  <div
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ml-auto",
                      netFlow >= 0
                        ? "bg-emerald-500/25 text-emerald-200 border-emerald-400/40"
                        : "bg-rose-500/25 text-rose-200 border-rose-400/40",
                      privacyMode && "privacy-blur",
                    )}
                    title="Net flow in the last 30 days"
                  >
                    {netFlow >= 0 ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownLeft size={12} />
                    )}
                    <span>
                      <span className="sr-only">30-day net flow </span>
                      {netFlow >= 0 ? "+" : "-"}
                      {formatCurrency(netFlow, displayCurrency)}
                    </span>
                  </div>
                </div>

                {totalAssets > 0 && (
                  <div
                    className="relative z-10 flex items-center gap-2"
                    title={`${share.toFixed(1)}% of total assets`}
                  >
                    <div
                      className="flex-1 h-1 rounded-full bg-black/30 overflow-hidden"
                      role="progressbar"
                      aria-label={`${account.name} share of total assets`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(share)}
                    >
                      <div
                        className="h-full rounded-full bg-white/70"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-white/70 tabular-nums">
                      {share.toFixed(share >= 10 || share === 0 ? 0 : 1)}% of
                      assets
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Adjust Balance Reconciliation Modal */}
      {reconcileAccount && (
        <Modal
          isOpen
          onClose={() => setReconcileAccount(null)}
          title={`Adjust Real Balance · ${reconcileAccount.name}`}
        >
          <form onSubmit={handleReconcileSubmit} className="space-y-3">
            <p className="text-xs text-white/60">
              Enter the exact balance shown in your real bank app or wallet.
              Walleteer will log a reconciliation transaction for the
              difference.
            </p>

            <div className="bg-white/[0.03] px-3 py-2 rounded-xl border border-white/[0.06] flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-white/60">Recorded Balance</span>
              <span className="font-bold text-white truncate">
                {reconcileAccount.balance < 0 ? "-" : ""}
                {formatCurrency(reconcileAccount.balance, reconcileCurrency)}
              </span>
            </div>

            <Input
              label="Actual Current Balance"
              type="number"
              step="0.01"
              required
              inputMode="decimal"
              placeholder="0.00"
              value={actualBalanceInput}
              onChange={(e) => setActualBalanceInput(e.target.value)}
              className="text-lg font-bold font-mono"
            />

            {reconcileDiff !== null && (
              <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-2 text-xs">
                <span className="text-blue-300">Adjustment Difference</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    reconcileDiff >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {reconcileDiff >= 0 ? "+" : "-"}
                  {formatCurrency(reconcileDiff, reconcileCurrency)}
                </span>
              </div>
            )}

            <Input
              label="Note (Optional)"
              type="text"
              placeholder="e.g. Month-end bank statement sync"
              value={reconcileNote}
              onChange={(e) => setReconcileNote(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReconcileAccount(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={reconcileDiff === null}
                className={PRIMARY_BTN}
              >
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
        title={
          editingAccount ? "Edit Account / Asset" : "Add Bank Card or Asset"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Account / Asset Name"
            placeholder="e.g. CIB Wealth, Vodafone Cash, 24K Gold Bullion"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              label="Asset Vault Category"
              value={form.assetType}
              onChange={(e) => {
                const val = e.target.value as AssetType;
                let cur = form.currency;
                if (val === "gold_24k" || val === "gold_21k") cur = "EGP";
                else if (
                  val === "foreign_currency" &&
                  !FOREIGN_CURRENCIES.includes(cur)
                )
                  cur = "USD";
                setForm({ ...form, assetType: val, currency: cur });
              }}
              options={Object.entries(ASSET_TYPE_LABELS).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </div>

          {form.assetType !== "standard" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Input
                label={
                  form.assetType.includes("gold")
                    ? "Gold Weight (Grams)"
                    : "Units in Foreign Currency"
                }
                type="number"
                step="0.01"
                min="0"
                required
                inputMode="decimal"
                placeholder="e.g. 10 for 10g Gold, 500 for $500"
                value={form.unitBalance}
                onChange={(e) =>
                  setForm({ ...form, unitBalance: e.target.value })
                }
                className="font-mono font-bold"
              />

              {form.assetType === "foreign_currency" ? (
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                  options={[
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "SAR", label: "SAR (ر.س)" },
                  ]}
                />
              ) : (
                <div>
                  <span className="label-base">Priced in</span>
                  <p className="input-base text-white/70 cursor-default">
                    EGP per gram (live rate)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={editingAccount ? "Current Balance" : "Starting Balance"}
                type="number"
                step="0.01"
                inputMode="decimal"
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

          <div>
            <span className="label-base">Card Theme</span>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              role="group"
              aria-label="Card theme"
            >
              {Object.values(CARD_THEMES).map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  aria-pressed={form.brandTheme === theme.id}
                  onClick={() => setForm({ ...form, brandTheme: theme.id })}
                  className={cn(
                    "px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between gap-1 transition-all bg-gradient-to-r focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                    theme.gradient,
                    form.brandTheme === theme.id
                      ? "ring-2 ring-white border-white"
                      : "border-white/10 opacity-70 hover:opacity-100",
                  )}
                >
                  <span className="truncate text-white drop-shadow">
                    {theme.name}
                  </span>
                  {form.brandTheme === theme.id && (
                    <Check size={14} className="text-white flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Masked Number / Label on Card"
            type="text"
            placeholder="e.g. •••• 4829 or 010 •••• 9102"
            value={form.accountNumberMasked}
            onChange={(e) =>
              setForm({ ...form, accountNumberMasked: e.target.value })
            }
            className="font-mono"
          />

          <div className="flex gap-3 pt-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className={cn("flex-1", PRIMARY_BTN)}>
              {editingAccount ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Live FX Rates Edit Modal */}
      {showRatesModal && (
        <Modal
          isOpen
          onClose={() => setShowRatesModal(false)}
          title="Update FX & Gold Rates"
        >
          <form onSubmit={handleSaveRates} className="space-y-3">
            <p className="text-xs text-white/60">
              Set conversion rates to Egyptian Pound (EGP). Foreign currency and
              gold accounts are revalued immediately.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RATE_FIELDS.map(({ key, label, step }) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  step={step}
                  min="0"
                  required
                  inputMode="decimal"
                  value={tempRates[key]}
                  onChange={(e) =>
                    setTempRates({
                      ...tempRates,
                      [key]: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="font-mono font-bold"
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRatesModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className={PRIMARY_BTN}>
                Update Rates
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!accountToDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteAccount(confirmDelete);
        }}
        title="Delete Account?"
        message={`This permanently deletes "${accountToDelete?.name ?? "this account"}" along with its transactions, recurring bills and IOUs. This cannot be undone.`}
      />
    </div>
  );
}
