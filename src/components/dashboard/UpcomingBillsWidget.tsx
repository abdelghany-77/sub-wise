import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, parseLocalDate, cn } from "../../lib/utils";

interface Props {
  onViewAll?: () => void;
}

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function UpcomingBillsWidget({ onViewAll }: Props) {
  const { recurring, accounts, markBillAsPaid, privacyMode } = useStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISO(today);
  const in7DaysStr = toISO(new Date(today.getTime() + 7 * 864e5));

  // Active bills due in the next 7 days (overdue ones are included so they aren't forgotten)
  const upcomingBills = recurring
    .filter(
      (r) =>
        r.type === "expense" &&
        r.status !== "paused" &&
        r.nextDueDate <= in7DaysStr &&
        r.nextDueDate >= toISO(new Date(today.getTime() - 14 * 864e5)),
    )
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 4);

  const getDaysLeft = (dueDate: string) => {
    const diff = Math.round(
      (parseLocalDate(dueDate).getTime() - today.getTime()) / 864e5,
    );
    if (dueDate < todayStr) return { label: "Overdue", urgent: true };
    if (diff <= 0) return { label: "Due today", urgent: true };
    if (diff === 1) return { label: "Tomorrow", urgent: true };
    return { label: `In ${diff} days`, urgent: false };
  };

  return (
    <Card padding="sm" className="relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center">
            <CalendarClock size={16} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">Upcoming Bills</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
              Next 7 days · {upcomingBills.length}
            </span>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors py-1 px-2.5 rounded-lg hover:bg-amber-400/10"
          >
            <span>Manage</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {upcomingBills.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 px-3 py-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
            <Sparkles size={15} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              All clear for the next 7 days
            </p>
            <p className="text-[11px] text-white/40">
              No recurring bills are due this week.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {upcomingBills.map((bill) => {
            const account = accounts.find((a) => a.id === bill.accountId);
            const daysLeft = getDaysLeft(bill.nextDueDate);

            return (
              <div
                key={bill.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5 flex flex-col gap-2",
                  daysLeft.urgent
                    ? "bg-amber-500/[0.06] border-amber-500/20"
                    : "bg-white/[0.03] border-white/[0.07]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {bill.name}
                    </p>
                    <p className="text-[10px] text-white/40 truncate">
                      {account?.name || "Account"} • {bill.category}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-semibold border flex-shrink-0",
                      daysLeft.urgent
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-white/[0.06] text-white/60 border-white/[0.08]",
                    )}
                  >
                    {daysLeft.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
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
    </Card>
  );
}
