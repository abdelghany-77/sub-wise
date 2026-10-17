import { useState } from "react";
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Trash2,
  Calendar,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Tag,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatCurrency, formatDate, cn } from "../../lib/utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../types";

export function SubscriptionsPanel() {
  const { recurring, accounts, addRecurringBill, deleteRecurringBill, markBillAsPaid, privacyMode } =
    useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("monthly");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] as string);
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");

  const todayStr = new Date().toISOString().split("T")[0];

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name || isNaN(parsedAmount) || parsedAmount <= 0 || !accountId) return;

    addRecurringBill({
      name,
      amount: parsedAmount,
      frequency,
      type,
      category,
      nextDueDate,
      accountId,
    });

    // Reset & close
    setName("");
    setAmount("");
    setShowAddModal(false);
  };

  // Summary Metrics
  const monthlyExpenses = recurring
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + (r.frequency === "monthly" ? r.amount : r.amount / 12), 0);

  const monthlyIncome = recurring
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + (r.frequency === "monthly" ? r.amount : r.amount / 12), 0);

  const upcoming7Days = recurring.filter((r) => {
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
    return r.nextDueDate >= todayStr && r.nextDueDate <= in7;
  });

  const filteredBills = recurring.filter((r) => {
    if (filterType === "all") return true;
    return r.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Recurring Bills & Subscriptions</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {recurring.length} commitments
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Track fixed commitments, rent, subscriptions, and salary streams automatically.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Recurring Item</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Monthly Commitments */}
        <Card className="p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="stat-label">Monthly Fixed Outflow</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <TrendingDown size={17} />
            </div>
          </div>
          <p
            className={cn(
              "stat-value text-2xl font-bold text-rose-400 mt-2",
              privacyMode && "privacy-blur",
            )}
          >
            {formatCurrency(monthlyExpenses, "EGP")}
            <span className="text-xs text-white/40 font-normal"> / mo</span>
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            Annual: {formatCurrency(monthlyExpenses * 12, "EGP")}
          </p>
        </Card>

        {/* Monthly Recurring Income */}
        <Card className="p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="stat-label">Fixed Recurring Inflow</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={17} />
            </div>
          </div>
          <p
            className={cn(
              "stat-value text-2xl font-bold text-emerald-400 mt-2",
              privacyMode && "privacy-blur",
            )}
          >
            {formatCurrency(monthlyIncome, "EGP")}
            <span className="text-xs text-white/40 font-normal"> / mo</span>
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            Salaries & steady contract retainers
          </p>
        </Card>

        {/* Next 7 Days Attention */}
        <Card className="p-4 sm:p-5 relative overflow-hidden border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="stat-label text-amber-300">Due in Next 7 Days</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CalendarClock size={17} />
            </div>
          </div>
          <p className="stat-value text-2xl font-bold text-white mt-2">
            {upcoming7Days.length}{" "}
            <span className="text-xs text-white/40 font-normal">bills pending</span>
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">
            Totaling {formatCurrency(upcoming7Days.reduce((s, b) => s + b.amount, 0), "EGP")}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        {(["all", "expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all",
              filterType === t
                ? "bg-white/10 text-white border border-white/15 shadow-sm"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {t === "all" ? "All Commitments" : t === "expense" ? "Expenses & Bills" : "Income Streams"}
          </button>
        ))}
      </div>

      {/* Commitments List */}
      {filteredBills.length === 0 ? (
        <Card className="text-center py-14 p-6">
          <CalendarClock size={36} className="mx-auto text-white/20 mb-3" />
          <h3 className="text-base font-semibold text-white">No recurring commitments found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-4">
            Add recurring commitments like rent, internet, gym, Netflix, or salary to track your fixed cash flows.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs mx-auto"
          >
            <Plus size={14} className="mr-1.5" />
            Add First Commitment
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBills.map((bill) => {
            const account = accounts.find((a) => a.id === bill.accountId);
            const isDueSoon = bill.nextDueDate <= new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];

            return (
              <div
                key={bill.id}
                className={cn(
                  "glass-card p-4 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 border hover:border-white/20",
                  isDueSoon && bill.type === "expense" ? "border-amber-500/30 bg-[#161824]" : "border-white/[0.08]",
                )}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold",
                        bill.type === "income"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                      )}
                    >
                      {bill.type === "income" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{bill.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-white/40 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Tag size={11} />
                          {bill.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CreditCard size={11} />
                          {account?.name || "Account"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Frequency */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "text-base font-bold font-mono tabular-nums",
                        bill.type === "income" ? "text-emerald-400" : "text-white",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {bill.type === "income" ? "+" : "-"}
                      {formatCurrency(bill.amount, account?.currency || "EGP")}
                    </p>
                    <span className="text-[10px] text-white/40 uppercase font-medium">
                      Per {bill.frequency}
                    </span>
                  </div>
                </div>

                {/* Footer: Due date pill & Action buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar size={13} className="text-white/40" />
                    <span className="text-white/40 text-[11px]">Next due:</span>
                    <span
                      className={cn(
                        "font-mono font-medium text-[11px] px-2 py-0.5 rounded-full border",
                        isDueSoon
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-white/[0.05] text-white/70 border-white/10",
                      )}
                    >
                      {formatDate(bill.nextDueDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mark as paid button */}
                    <button
                      onClick={() => markBillAsPaid(bill.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition-all"
                      title="Logs transaction into account and rolls due date by 1 cycle"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Paid</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteRecurringBill(bill.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-colors"
                      title="Delete recurring commitment"
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

      {/* Add Recurring Bill Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Recurring Commitment"
        >
          <form onSubmit={handleAddBill} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 bg-white/[0.05] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  setCategory(EXPENSE_CATEGORIES[0]);
                }}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold transition-all",
                  type === "expense"
                    ? "bg-rose-500 text-white shadow-md"
                    : "text-white/50 hover:text-white",
                )}
              >
                Expense / Bill
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  setCategory(INCOME_CATEGORIES[0]);
                }}
                className={cn(
                  "py-2 rounded-lg text-xs font-semibold transition-all",
                  type === "income"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-white/50 hover:text-white",
                )}
              >
                Income / Salary
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="label-base">Commitment Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Fiber Internet, Gym Membership, Netflix"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
              />
            </div>

            {/* Amount & Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Amount</label>
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

              <div>
                <label className="label-base">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as "monthly" | "yearly")}
                  className="input-base"
                >
                  <option value="monthly" className="bg-[#111827]">Monthly</option>
                  <option value="yearly" className="bg-[#111827]">Yearly</option>
                </select>
              </div>
            </div>

            {/* Category & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label-base">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-base"
                >
                  {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat} className="bg-[#111827]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-base">Debit/Credit Account</label>
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
            </div>

            {/* Next Due Date */}
            <div>
              <label className="label-base">Next Due Date</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="input-base"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                Save Commitment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
