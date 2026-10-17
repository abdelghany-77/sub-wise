import { CalendarClock, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, cn } from "../../lib/utils";

interface Props {
  onViewAll?: () => void;
}

export function UpcomingBillsWidget({ onViewAll }: Props) {
  const { recurring, accounts, markBillAsPaid, privacyMode } = useStore();

  const todayStr = new Date().toISOString().split("T")[0];
  const in7DaysStr = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];

  // Active bills due in next 7 days, max 4 items
  const upcomingBills = recurring
    .filter(
      (r) =>
        r.type === "expense" &&
        r.status !== "paused" &&
        r.nextDueDate >= todayStr &&
        r.nextDueDate <= in7DaysStr,
    )
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 4);

  const getDaysLeft = (dueDate: string) => {
    const diff = Math.ceil(
      (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff <= 0) return { label: "Due Today", urgent: true };
    if (diff === 1) return { label: "Tomorrow", urgent: true };
    return { label: `In ${diff} days`, urgent: false };
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center">
            <CalendarClock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Upcoming Bills</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                Next 7 Days ({upcomingBills.length})
              </span>
            </div>
            <p className="text-[11px] text-white/40">Fixed commitments due soon</p>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors py-1 px-2.5 rounded-lg hover:bg-amber-400/10"
          >
            <span>Manage All</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 mt-2">
        {upcomingBills.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-500/20">
              <Sparkles size={18} />
            </div>
            <p className="text-xs font-semibold text-white">All Clear for Next 7 Days</p>
            <p className="text-[11px] text-white/40 mt-0.5 max-w-xs">
              No recurring bills or fixed commitments are due this week.
            </p>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="mt-3 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                View all commitments →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {upcomingBills.map((bill) => {
              const account = accounts.find((a) => a.id === bill.accountId);
              const daysLeft = getDaysLeft(bill.nextDueDate);

              return (
                <div
                  key={bill.id}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-white/[0.02] px-1 rounded-xl transition-colors"
                >
                  {/* Left Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 flex-shrink-0">
                      <AlertCircle
                        size={15}
                        className={daysLeft.urgent ? "text-amber-400" : "text-white/40"}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate max-w-[130px] sm:max-w-[170px]">
                          {bill.name}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[9px] font-medium border flex-shrink-0",
                            daysLeft.urgent
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-white/[0.06] text-white/60 border-white/[0.08]",
                          )}
                        >
                          {daysLeft.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block truncate">
                        {account?.name || "Account"} • {bill.category}
                      </span>
                    </div>
                  </div>

                  {/* Right Action: Amount & Pay */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-auto">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold font-mono text-white tabular-nums",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {formatCurrency(bill.amount, account?.currency || "EGP")}
                    </span>

                    <button
                      onClick={() => markBillAsPaid(bill.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                      title="Logs payment into account and advances due date"
                    >
                      <CheckCircle2 size={12} />
                      <span>Pay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
