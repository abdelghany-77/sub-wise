import { useState } from "react";
import {
  Users2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  Calendar,
  CreditCard,
  User,
  Sparkles,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatCurrency, formatDate, cn } from "../../lib/utils";
import type { IouType } from "../../types";

export function IousPanel() {
  const { ious, accounts, addIou, deleteIou, settleIou, privacyMode } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "lent" | "borrowed">("all");
  const [statusFilter, setStatusFilter] = useState<"pending" | "settled" | "all">("pending");

  // Form state
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<IouType>("lent");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [deductFromAccount, setDeductFromAccount] = useState(true);

  // Settle Modal State
  const [settlingIouId, setSettlingIouId] = useState<string | null>(null);
  const [settleAccountId, setSettleAccountId] = useState(accounts[0]?.id || "");

  const handleAddIou = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!personName || isNaN(parsedAmount) || parsedAmount <= 0 || !accountId) return;

    addIou(
      {
        personName,
        amount: parsedAmount,
        type,
        accountId,
        dueDate: dueDate || undefined,
        note: note || undefined,
      },
      deductFromAccount,
    );

    setPersonName("");
    setAmount("");
    setNote("");
    setDueDate("");
    setShowAddModal(false);
  };

  const handleSettleSubmit = () => {
    if (settlingIouId) {
      settleIou(settlingIouId, settleAccountId);
      setSettlingIouId(null);
    }
  };

  // Metrics
  const totalLentPending = ious
    .filter((i) => i.status === "pending" && i.type === "lent")
    .reduce((s, i) => s + i.amount, 0);

  const totalBorrowedPending = ious
    .filter((i) => i.status === "pending" && i.type === "borrowed")
    .reduce((s, i) => s + i.amount, 0);

  const netIouBalance = totalLentPending - totalBorrowedPending;

  const filteredIous = ious.filter((i) => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>IOUs: Lent & Borrowed</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              {ious.filter((i) => i.status === "pending").length} active
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Track money owed to you (ليا بره) and debts you owe others (عليا) with one-click settlements.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Record IOU</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Lent (Receivables) */}
        <Card className="p-4 sm:p-5 relative overflow-hidden border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="stat-label text-emerald-300">Money Lent (ليا بره)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight size={17} />
            </div>
          </div>
          <p
            className={cn(
              "stat-value text-2xl font-bold text-emerald-400 mt-2",
              privacyMode && "privacy-blur",
            )}
          >
            +{formatCurrency(totalLentPending, "EGP")}
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            External receivables counted in Net Worth
          </p>
        </Card>

        {/* Total Borrowed (Payables) */}
        <Card className="p-4 sm:p-5 relative overflow-hidden border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="stat-label text-rose-300">Money Borrowed (عليا)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownLeft size={17} />
            </div>
          </div>
          <p
            className={cn(
              "stat-value text-2xl font-bold text-rose-400 mt-2",
              privacyMode && "privacy-blur",
            )}
          >
            -{formatCurrency(totalBorrowedPending, "EGP")}
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            Liabilities deducted from Net Worth
          </p>
        </Card>

        {/* Net Receivable Position */}
        <Card className="p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="stat-label">Net External Position</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Sparkles size={17} />
            </div>
          </div>
          <p
            className={cn(
              "stat-value text-2xl font-bold mt-2",
              netIouBalance >= 0 ? "text-emerald-400" : "text-rose-400",
              privacyMode && "privacy-blur",
            )}
          >
            {netIouBalance >= 0 ? "+" : ""}
            {formatCurrency(netIouBalance, "EGP")}
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            {netIouBalance >= 0 ? "Others owe you more" : "You owe more than owed"}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        {/* Type filters */}
        <div className="flex items-center gap-2">
          {(["all", "lent", "borrowed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all",
                filterType === t
                  ? "bg-white/10 text-white border border-white/15"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              {t === "all" ? "All IOUs" : t === "lent" ? "Lent (ليا بره)" : "Borrowed (عليا)"}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
          {(["pending", "settled", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/40 hover:text-white",
              )}
            >
              {s === "pending" ? "Active" : s === "settled" ? "Settled" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* IOUs Cards List */}
      {filteredIous.length === 0 ? (
        <Card className="text-center py-14 p-6">
          <Users2 size={36} className="mx-auto text-white/20 mb-3" />
          <h3 className="text-base font-semibold text-white">No IOU records found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-4">
            Record money you lent to friends or colleagues, or track personal debts until settled.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs mx-auto"
          >
            <Plus size={14} className="mr-1.5" />
            Record New IOU
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredIous.map((iou) => {
            const account = accounts.find((a) => a.id === iou.accountId);
            const isSettled = iou.status === "settled";

            return (
              <div
                key={iou.id}
                className={cn(
                  "glass-card p-4 rounded-2xl flex flex-col justify-between gap-3 transition-all duration-200 border",
                  isSettled
                    ? "opacity-60 border-white/[0.04] bg-[#0c1017]"
                    : iou.type === "lent"
                      ? "border-emerald-500/25 bg-[#0d1618]"
                      : "border-rose-500/25 bg-[#180f14]",
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold",
                        iou.type === "lent"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                      )}
                    >
                      <User size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">{iou.personName}</h4>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border",
                            iou.type === "lent"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30",
                          )}
                        >
                          {iou.type === "lent" ? "Lent / ليا" : "Borrowed / عليا"}
                        </span>
                      </div>
                      {iou.note && (
                        <p className="text-xs text-white/50 truncate mt-0.5">{iou.note}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-white/40 mt-1">
                        <span className="flex items-center gap-1">
                          <CreditCard size={11} />
                          {account?.name || "Account"}
                        </span>
                        {iou.dueDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              Due {formatDate(iou.dueDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "text-base font-bold font-mono tabular-nums",
                        iou.type === "lent" ? "text-emerald-400" : "text-rose-400",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {iou.type === "lent" ? "+" : "-"}
                      {formatCurrency(iou.amount, "EGP")}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                        isSettled
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-300",
                      )}
                    >
                      {isSettled ? "Settled ✓" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] text-white/30 font-mono">
                    Created {formatDate(iou.createdAt)}
                    {iou.settledDate && ` · Settled ${formatDate(iou.settledDate)}`}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isSettled && (
                      <button
                        onClick={() => {
                          setSettlingIouId(iou.id);
                          setSettleAccountId(iou.accountId);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <CheckCircle2 size={13} />
                        <span>Settle / تم السداد</span>
                      </button>
                    )}

                    <button
                      onClick={() => deleteIou(iou.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record IOU Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Record IOU / سلفة أو دين"
        >
          <form onSubmit={handleAddIou} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 bg-white/[0.05] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType("lent")}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold transition-all",
                  type === "lent"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-white/50 hover:text-white",
                )}
              >
                I Lent Money (ليا بره)
              </button>
              <button
                type="button"
                onClick={() => setType("borrowed")}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold transition-all",
                  type === "borrowed"
                    ? "bg-rose-600 text-white shadow-md"
                    : "text-white/50 hover:text-white",
                )}
              >
                I Borrowed Money (عليا)
              </button>
            </div>

            {/* Person Name */}
            <div>
              <label className="label-base">Person / Counterparty</label>
              <input
                type="text"
                required
                placeholder="e.g. Ahmed Tarek, Omar Adel"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="input-base"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="label-base">Amount (EGP)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-base font-mono font-bold"
              />
            </div>

            {/* Account & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Linked Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-base"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-[#111827]">
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-base">Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="label-base">Note / Reason</label>
              <input
                type="text"
                placeholder="e.g. Dinner split, emergency loan"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-base"
              />
            </div>

            {/* Deduct toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={deductFromAccount}
                onChange={(e) => setDeductFromAccount(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-white/70">
                {type === "lent"
                  ? "Deduct money from account now (keeps account balance accurate)"
                  : "Add borrowed cash to account balance now"}
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Save Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Settle Confirmation Modal */}
      {settlingIouId && (
        <Modal
          isOpen={!!settlingIouId}
          onClose={() => setSettlingIouId(null)}
          title="Settle IOU / تسوية السداد"
        >
          <div className="space-y-4">
            <p className="text-sm text-white/80">
              Confirm settlement. The funds will be automatically updated in the selected account and logged cleanly.
            </p>

            <div>
              <label className="label-base">Deposit / Debit Account</label>
              <select
                value={settleAccountId}
                onChange={(e) => setSettleAccountId(e.target.value)}
                className="input-base"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#111827]">
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Button variant="ghost" onClick={() => setSettlingIouId(null)}>
                Cancel
              </Button>
              <Button onClick={handleSettleSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Confirm Settlement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
