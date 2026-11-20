import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import {
  formatCurrency,
  parseLocalDate,
  todayISO,
  addDaysISO,
  getAccountBalanceCurrency,
  cn,
} from "../../lib/utils";

interface Props {
  onViewAll?: () => void;
}

interface UpcomingItem {
  id: string;
  kind: "bill" | "installment";
  name: string;
  subtitle: string;
  amount: number;
  currency: string;
  dueDate: string;
}

export function UpcomingBillsWidget({ onViewAll }: Props) {
  const {
    recurring,
    installments,
    accounts,
    markBillAsPaid,
    payInstallment,
    privacyMode,
  } = useStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = todayISO();
  const in7DaysStr = addDaysISO(7);
  const past14DaysStr = addDaysISO(-14);

  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const upcomingItems: UpcomingItem[] = [
    ...recurring
      .filter(
        (r) =>
          r.type === "expense" &&
          r.status !== "paused" &&
          r.nextDueDate <= in7DaysStr &&
          r.nextDueDate >= past14DaysStr,
      )
      .map((bill) => {
        const account = accMap.get(bill.accountId);
        return {
          id: bill.id,
          kind: "bill" as const,
          name: bill.name,
          subtitle: `${account?.name || "Account"} • ${bill.category}`,
          amount: bill.amount,
          currency: getAccountBalanceCurrency(account),
          dueDate: bill.nextDueDate,
        };
      }),
    ...(installments ?? [])
      .filter(
        (inst) =>
          inst.status === "active" &&
          inst.nextDueDate <= in7DaysStr &&
          inst.nextDueDate >= past14DaysStr,
      )
      .map((inst) => {
        const account = accMap.get(inst.accountId);
        return {
          id: inst.id,
          kind: "installment" as const,
          name: inst.name,
          subtitle: `${inst.provider ? `${inst.provider} • ` : ""}${inst.paidMonths + 1}/${inst.totalMonths}`,
          amount: inst.monthlyAmount,
          currency: getAccountBalanceCurrency(account),
          dueDate: inst.nextDueDate,
        };
      }),
  ]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const getDaysLeft = (dueDate: string) => {
    const diff = Math.round(
      (parseLocalDate(dueDate).getTime() - today.getTime()) / 864e5,
    );
    if (dueDate < todayStr) return { label: "Overdue", urgent: true };
    if (diff <= 0) return { label: "Due today", urgent: true };
    if (diff === 1) return { label: "Tomorrow", urgent: true };
    return { label: `In ${diff}d`, urgent: false };
  };

  return (
    <Card padding="sm" className="relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <CalendarClock size={16} />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              Upcoming Commitments
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25 whitespace-nowrap">
              Next 7d · {upcomingItems.length}
            </span>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-amber-400/10 flex-shrink-0"
          >
            <span>Manage</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {upcomingItems.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 px-3 py-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
            <Sparkles size={15} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              All clear for the next 7 days
            </p>
            <p className="text-[11px] text-white/40">
              No recurring bills or installments are due this week.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {upcomingItems.map((item) => {
            const daysLeft = getDaysLeft(item.dueDate);

            return (
              <div
                key={`${item.kind}-${item.id}`}
                className={cn(
                  "rounded-xl border px-3 py-2.5 flex flex-col gap-2",
                  daysLeft.urgent
                    ? "bg-amber-500/[0.06] border-amber-500/20"
                    : "bg-white/[0.03] border-white/[0.07]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.kind === "installment" && (
                        <Layers
                          size={11}
                          className="text-indigo-400 flex-shrink-0"
                        />
                      )}
                      <p className="text-xs font-semibold text-white truncate">
                        {item.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-white/40 truncate">
                      {item.subtitle}
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
                      "text-sm font-bold font-mono text-white tabular-nums truncate",
                      privacyMode && "privacy-blur",
                    )}
                  >
                    {formatCurrency(item.amount, item.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      item.kind === "bill"
                        ? markBillAsPaid(item.id)
                        : payInstallment(item.id)
                    }
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all flex-shrink-0"
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
