import { CalendarClock, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { formatCurrency, cn } from "../../lib/utils";

interface Props {
  onViewAll?: () => void;
}

export function UpcomingBillsWidget({ onViewAll }: Props) {
  const { recurring, accounts, markBillAsPaid, privacyMode } = useStore();

  const todayStr = new Date().toISOString().split("T")[0];
  const in7DaysStr = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];

  // Bills due in next 7 days
  const upcomingBills = recurring
    .filter(
      (r) => r.type === "expense" && r.nextDueDate >= todayStr && r.nextDueDate <= in7DaysStr,
    )
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

  if (upcomingBills.length === 0) {
    return null; // Don't crowd the dashboard if no bills are due in the next 7 days
  }

  const getDaysLeft = (dueDate: string) => {
    const diff = Math.ceil(
      (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return { label: "Due Today", urgent: true };
    if (diff === 1) return { label: "Tomorrow", urgent: true };
    return { label: `In ${diff} days`, urgent: false };
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1A1A2E]/90 to-[#121624]/90 backdrop-blur-xl border border-amber-500/25 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Ambient background alert glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <CalendarClock size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Upcoming Commitments</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Next 7 Days ({upcomingBills.length})
              </span>
            </div>
            <p className="text-[11px] text-white/40">Fixed bills & subscriptions requiring action</p>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Manage Bills</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Bills List */}
      <div className="divide-y divide-white/[0.04] mt-1 relative z-10">
        {upcomingBills.map((bill) => {
          const account = accounts.find((a) => a.id === bill.accountId);
          const daysLeft = getDaysLeft(bill.nextDueDate);

          return (
            <div
              key={bill.id}
              className="py-3 flex flex-wrap items-center justify-between gap-3 group hover:bg-white/[0.02] px-1 rounded-xl transition-colors"
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/70 flex-shrink-0 group-hover:border-amber-400/40 transition-colors">
                  <AlertCircle size={17} className={daysLeft.urgent ? "text-amber-400" : "text-white/50"} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{bill.name}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                        daysLeft.urgent
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                          : "bg-white/[0.06] text-white/60 border-white/[0.08]",
                      )}
                    >
                      {daysLeft.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/40 mt-0.5">
                    <span>{account?.name || "Default Account"}</span>
                    <span>•</span>
                    <span>{bill.category}</span>
                  </div>
                </div>
              </div>

              {/* Right Action: Amount & Mark As Paid */}
              <div className="flex items-center gap-3 ml-auto">
                <span
                  className={cn(
                    "text-sm font-bold font-mono text-white tabular-nums",
                    privacyMode && "privacy-blur",
                  )}
                >
                  {formatCurrency(bill.amount, account?.currency || "EGP")}
                </span>

                <button
                  onClick={() => markBillAsPaid(bill.id)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all border border-emerald-400/30"
                  title="Logs payment into account and rolls due date by 1 cycle"
                >
                  <CheckCircle2 size={13} />
                  <span>Mark as Paid</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
