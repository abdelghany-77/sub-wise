import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Users2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  CalendarClock,
  CreditCard,
  Scale,
  X,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

import {
  formatCurrency,
  formatDate,
  parseLocalDate,
  cn,
} from "../../lib/utils";
import type { Iou, IouType } from "../../types";

type TypeFilter = "all" | IouType;
type StatusFilter = "pending" | "settled" | "all";
type DueTone = "overdue" | "soon" | "normal" | "settled";

const MS_PER_DAY = 864e5;
const SOON_THRESHOLD_DAYS = 7;

const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";

const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  soon: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  normal: "bg-white/[0.05] text-white/50 border-white/[0.08]",
  settled: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const personKey = (name: string) => name.trim().toLowerCase();

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (parseLocalDate(dateStr).getTime() - today.getTime()) / MS_PER_DAY,
  );
}

function formatLocalDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function getDueBadge(iou: Iou): { label: string; tone: DueTone } | null {
  if (iou.status === "settled") {
    return {
      label: iou.settledDate
        ? `Settled ${formatLocalDate(iou.settledDate)}`
        : "Settled",
      tone: "settled",
    };
  }
  if (!iou.dueDate) return null;
  const days = daysUntil(iou.dueDate);
  if (days < 0) {
    return { label: `Overdue ${Math.abs(days)}d`, tone: "overdue" };
  }
  if (days === 0) return { label: "Due today", tone: "soon" };
  if (days <= SOON_THRESHOLD_DAYS)
    return { label: `Due in ${days}d`, tone: "soon" };
  return { label: `Due ${formatLocalDate(iou.dueDate)}`, tone: "normal" };
}

function compareIous(a: Iou, b: Iou): number {
  if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
  if (a.status === "pending") {
    if (a.dueDate && b.dueDate) {
      const byDue = a.dueDate.localeCompare(b.dueDate);
      if (byDue !== 0) return byDue;
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  }
  return (
    (b.settledDate ?? "").localeCompare(a.settledDate ?? "") ||
    b.createdAt.localeCompare(a.createdAt)
  );
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function MoneyValue({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="text-[9px] sm:text-[10px] font-medium text-white/40 mr-1">
        EGP
      </span>
      {formatCurrency(value, "").trim()}
    </span>
  );
}

interface KpiProps {
  label: string;
  hint?: string;
  icon: ReactNode;
  iconClass: string;
  borderClass?: string;
  title?: string;
  children: ReactNode;
}

function Kpi({
  label,
  hint,
  icon,
  iconClass,
  borderClass,
  title,
  children,
}: KpiProps) {
  return (
    <Card
      padding="sm"
      className={cn("p-2.5 sm:p-3.5 min-w-0", borderClass)}
      title={title}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="stat-label !tracking-wider text-[10px] sm:text-[11px] truncate">
          {label}
          {hint && (
            <span className="hidden lg:inline normal-case tracking-normal">
              {" "}
              · {hint}
            </span>
          )}
        </span>
        <span
          className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
            iconClass,
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] sm:text-lg font-bold font-mono tabular-nums leading-tight truncate">
        {children}
      </p>
    </Card>
  );
}

export function IousPanel() {
  const { ious, accounts, addIou, deleteIou, settleIou, privacyMode } =
    useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [personFilter, setPersonFilter] = useState<string | null>(null);

  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<IouType>("lent");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [deductFromAccount, setDeductFromAccount] = useState(true);

  const [settlingIouId, setSettlingIouId] = useState<string | null>(null);
  const [settleAccountId, setSettleAccountId] = useState(accounts[0]?.id || "");
  const [deletingIouId, setDeletingIouId] = useState<string | null>(null);

  const hasAccount = (id: string) => accounts.some((a) => a.id === id);
  const formAccountId = hasAccount(accountId)
    ? accountId
    : (accounts[0]?.id ?? "");
  const resolvedSettleAccountId = hasAccount(settleAccountId)
    ? settleAccountId
    : (accounts[0]?.id ?? "");

  const settlingIou = settlingIouId
    ? ious.find((i) => i.id === settlingIouId)
    : undefined;
  const deletingIou = deletingIouId
    ? ious.find((i) => i.id === deletingIouId)
    : undefined;

  const handleAddIou = (e: FormEvent) => {
    e.preventDefault();
    const name = personName.trim();
    const parsedAmount = parseFloat(amount);
    if (!name || isNaN(parsedAmount) || parsedAmount <= 0 || !formAccountId)
      return;

    addIou(
      {
        personName: name,
        amount: parsedAmount,
        type,
        accountId: formAccountId,
        dueDate: dueDate || undefined,
        note: note.trim() || undefined,
      },
      deductFromAccount,
    );

    if (filterType !== "all" && filterType !== type) setFilterType("all");
    if (statusFilter === "settled") setStatusFilter("pending");
    setPersonFilter(null);

    setPersonName("");
    setAmount("");
    setNote("");
    setDueDate("");
    setShowAddModal(false);
  };

  const handleSettleSubmit = () => {
    if (!settlingIou || !resolvedSettleAccountId) return;
    settleIou(settlingIou.id, resolvedSettleAccountId);
    setSettlingIouId(null);
  };

  const openSettle = (iou: Iou) => {
    setSettlingIouId(iou.id);
    setSettleAccountId(iou.accountId);
  };

  const { totalLent, totalBorrowed, net, pendingCount, people } =
    useMemo(() => {
      let lent = 0;
      let borrowed = 0;
      let count = 0;
      const byPerson = new Map<
        string,
        { key: string; name: string; net: number }
      >();

      for (const i of ious) {
        if (i.status !== "pending") continue;
        count += 1;
        const signed = i.type === "lent" ? i.amount : -i.amount;
        if (i.type === "lent") lent += i.amount;
        else borrowed += i.amount;

        const key = personKey(i.personName);
        const entry = byPerson.get(key) ?? {
          key,
          name: i.personName.trim(),
          net: 0,
        };
        entry.net += signed;
        byPerson.set(key, entry);
      }

      return {
        totalLent: lent,
        totalBorrowed: borrowed,
        net: roundMoney(lent - borrowed),
        pendingCount: count,
        people: [...byPerson.values()].sort(
          (a, b) => Math.abs(b.net) - Math.abs(a.net),
        ),
      };
    }, [ious]);

  const activePersonFilter =
    personFilter && people.some((p) => p.key === personFilter)
      ? personFilter
      : null;

  const statusScoped = ious.filter(
    (i) => statusFilter === "all" || i.status === statusFilter,
  );
  const typeCounts = {
    all: statusScoped.length,
    lent: statusScoped.filter((i) => i.type === "lent").length,
    borrowed: statusScoped.filter((i) => i.type === "borrowed").length,
  };

  const filteredIous = statusScoped
    .filter((i) => filterType === "all" || i.type === filterType)
    .filter(
      (i) =>
        !activePersonFilter || personKey(i.personName) === activePersonFilter,
    )
    .sort(compareIous);

  const isFiltered =
    filterType !== "all" ||
    statusFilter !== "pending" ||
    activePersonFilter !== null;

  const resetFilters = () => {
    setFilterType("all");
    setStatusFilter("pending");
    setPersonFilter(null);
  };

  const blur = privacyMode && "privacy-blur";
  const netTone =
    net > 0 ? "text-emerald-400" : net < 0 ? "text-rose-400" : "text-white/70";

  const typeChipClass = (t: TypeFilter, active: boolean) =>
    cn(
      "px-2.5 sm:px-3 min-h-[32px] rounded-full text-xs font-semibold border whitespace-nowrap transition-all flex-shrink-0",
      FOCUS_RING,
      !active &&
        "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.07]",
      active && t === "all" && "bg-white/15 border-white/25 text-white",
      active &&
        t === "lent" &&
        "bg-emerald-500/20 border-emerald-500/40 text-emerald-200",
      active &&
        t === "borrowed" &&
        "bg-rose-500/20 border-rose-500/40 text-rose-200",
    );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Kpi
          label="Lent"
          hint="ليا بره"
          icon={<ArrowUpRight size={14} />}
          iconClass="bg-emerald-500/20 text-emerald-400"
          borderClass="border-emerald-500/20"
          title="Pending money others owe you"
        >
          <span className={cn("text-emerald-400", blur)}>
            {totalLent > 0 && "+"}
            <MoneyValue value={totalLent} />
          </span>
        </Kpi>
        <Kpi
          label="Borrowed"
          hint="عليا"
          icon={<ArrowDownLeft size={14} />}
          iconClass="bg-rose-500/20 text-rose-400"
          borderClass="border-rose-500/20"
          title="Pending money you owe others"
        >
          <span className={cn("text-rose-400", blur)}>
            {totalBorrowed > 0 && "-"}
            <MoneyValue value={totalBorrowed} />
          </span>
        </Kpi>
        <Kpi
          label="Net"
          icon={<Scale size={14} />}
          iconClass="bg-blue-500/20 text-blue-400"
          title="Net position = lent − borrowed (pending only)"
        >
          <span className={cn(netTone, blur)}>
            {net > 0 && "+"}
            {net < 0 && "-"}
            <MoneyValue value={net} />
          </span>
        </Kpi>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Filter by type"
            className={cn(
              "flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 py-0.5",
              HIDE_SCROLLBAR,
            )}
          >
            {(["all", "lent", "borrowed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={filterType === t}
                onClick={() => setFilterType(t)}
                className={typeChipClass(t, filterType === t)}
              >
                <span className="capitalize">{t}</span>
                <span className="ml-1.5 font-mono text-[10px] opacity-70">
                  {typeCounts[t]}
                </span>
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            icon={<Plus size={15} />}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30 flex-shrink-0 min-h-[36px] focus:ring-indigo-400/50"
          >
            Add IOU
          </Button>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 overflow-x-auto py-0.5",
            HIDE_SCROLLBAR,
          )}
        >
          <div
            role="group"
            aria-label="Filter by status"
            className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.06] flex-shrink-0"
          >
            {(["pending", "settled", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 min-h-[28px] rounded-lg text-xs font-medium transition-all",
                  FOCUS_RING,
                  statusFilter === s
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-white/50 hover:text-white",
                )}
              >
                {s === "pending"
                  ? "Active"
                  : s === "settled"
                    ? "Settled"
                    : "All"}
              </button>
            ))}
          </div>

          {people.length > 0 && (
            <>
              <span
                className="h-5 w-px bg-white/10 flex-shrink-0"
                aria-hidden="true"
              />
              <div
                role="group"
                aria-label="Filter by person (net position)"
                className="flex items-center gap-1.5"
              >
                {people.map((p) => {
                  const selected = activePersonFilter === p.key;
                  const personNet = roundMoney(p.net);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      aria-pressed={selected}
                      title={`${p.name}: ${personNet >= 0 ? "owes you" : "you owe"} ${formatCurrency(personNet)}`}
                      onClick={() => setPersonFilter(selected ? null : p.key)}
                      className={cn(
                        "flex items-center gap-1.5 pl-2.5 pr-2.5 min-h-[28px] rounded-full border text-xs transition-all flex-shrink-0",
                        FOCUS_RING,
                        selected
                          ? "bg-indigo-500/20 border-indigo-400/40 text-white"
                          : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.07]",
                      )}
                    >
                      <span className="max-w-[7rem] truncate font-medium">
                        {p.name}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[10px] tabular-nums",
                          personNet > 0 && "text-emerald-400",
                          personNet < 0 && "text-rose-400",
                          personNet === 0 && "text-white/40",
                          blur,
                        )}
                      >
                        {personNet > 0 && "+"}
                        {personNet < 0 && "-"}
                        {formatCurrency(personNet, "").trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {filteredIous.length === 0 ? (
        <Card padding="sm" className="text-center py-8 sm:py-10">
          <Users2
            size={30}
            className="mx-auto text-white/20 mb-2"
            aria-hidden="true"
          />
          {ious.length === 0 ? (
            <>
              <h3 className="text-sm font-semibold text-white">No IOUs yet</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-3">
                Record money you lent or borrowed and settle it in one tap when
                it is paid back.
              </p>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                icon={<Plus size={14} />}
                className="bg-indigo-600 hover:bg-indigo-500 text-white mx-auto"
              >
                Record first IOU
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-white">
                {pendingCount === 0 && !isFiltered
                  ? "All settled up"
                  : "No IOUs match these filters"}
              </h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-3">
                {pendingCount === 0 && !isFiltered
                  ? "Nothing is pending right now."
                  : "Try a different type, status or person."}
              </p>
              {isFiltered && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetFilters}
                  icon={<X size={14} />}
                  className="mx-auto"
                >
                  Reset filters
                </Button>
              )}
            </>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
          {filteredIous.map((iou) => {
            const account = accounts.find((a) => a.id === iou.accountId);
            const isSettled = iou.status === "settled";
            const isLent = iou.type === "lent";
            const due = getDueBadge(iou);
            const initial =
              iou.personName.trim().charAt(0).toUpperCase() || "?";

            return (
              <article
                key={iou.id}
                title={`Created ${formatDate(iou.createdAt)}`}
                className={cn(
                  "glass-card rounded-2xl p-3 flex flex-col gap-2.5 border-l-[3px] transition-all duration-200 animate-fade-in",
                  "hover:bg-white/[0.07] focus-within:bg-white/[0.07]",
                  isSettled
                    ? "opacity-60 hover:opacity-100 border-l-white/15"
                    : isLent
                      ? "border-l-emerald-500/70"
                      : "border-l-rose-500/70",
                  due?.tone === "overdue" && "ring-1 ring-rose-500/30",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold border",
                      isLent
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30",
                    )}
                  >
                    {initial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {iou.personName}
                      </h4>
                      <span
                        className={cn(
                          "px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide border flex-shrink-0",
                          isLent
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/25",
                        )}
                      >
                        {isLent ? "Lent" : "Borrowed"}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xs truncate mt-0.5",
                        iou.note ? "text-white/50" : "text-white/25 italic",
                      )}
                      title={iou.note}
                    >
                      {iou.note || "No note"}
                    </p>
                  </div>

                  <p
                    className={cn(
                      "text-sm sm:text-[15px] font-bold font-mono tabular-nums text-right flex-shrink-0",
                      isLent ? "text-emerald-400" : "text-rose-400",
                      blur,
                    )}
                  >
                    {isLent ? "+" : "-"}
                    <MoneyValue value={iou.amount} />
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-white/40">
                    {due && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap flex-shrink-0",
                          DUE_TONE_CLASS[due.tone],
                        )}
                      >
                        {due.tone !== "settled" && (
                          <CalendarClock size={10} aria-hidden="true" />
                        )}
                        {due.tone === "settled" && (
                          <CheckCircle2 size={10} aria-hidden="true" />
                        )}
                        {due.label}
                      </span>
                    )}
                    <span
                      className="flex items-center gap-1 min-w-0"
                      title={
                        account ? undefined : "This account no longer exists"
                      }
                    >
                      <CreditCard
                        size={11}
                        className="flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {account?.name || "Unknown account"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isSettled && (
                      <button
                        type="button"
                        onClick={() => openSettle(iou)}
                        aria-label={`Settle IOU with ${iou.personName}`}
                        className={cn(
                          "px-2.5 min-h-[34px] rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
                        )}
                      >
                        <CheckCircle2 size={13} aria-hidden="true" />
                        <span>Settle</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingIouId(iou.id)}
                      aria-label={`Delete IOU with ${iou.personName}`}
                      title="Delete record"
                      className={cn(
                        "w-[34px] h-[34px] flex items-center justify-center rounded-lg text-white/40 hover:bg-rose-500/15 hover:text-rose-400 active:bg-rose-500/25 transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60",
                      )}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record IOU / سلفة أو دين"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="iou-form"
              disabled={accounts.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Save Record
            </Button>
          </div>
        }
      >
        <form id="iou-form" onSubmit={handleAddIou} className="space-y-4">
          <div
            role="group"
            aria-label="IOU type"
            className="grid grid-cols-2 gap-2 bg-white/[0.05] p-1 rounded-xl"
          >
            <button
              type="button"
              aria-pressed={type === "lent"}
              onClick={() => setType("lent")}
              className={cn(
                "py-2.5 rounded-lg text-xs font-semibold transition-all",
                FOCUS_RING,
                type === "lent"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-white/50 hover:text-white",
              )}
            >
              I Lent Money (ليا بره)
            </button>
            <button
              type="button"
              aria-pressed={type === "borrowed"}
              onClick={() => setType("borrowed")}
              className={cn(
                "py-2.5 rounded-lg text-xs font-semibold transition-all",
                FOCUS_RING,
                type === "borrowed"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-white/50 hover:text-white",
              )}
            >
              I Borrowed Money (عليا)
            </button>
          </div>

          <div>
            <label htmlFor="iou-person" className="label-base">
              Person / Counterparty
            </label>
            <input
              id="iou-person"
              type="text"
              required
              placeholder="e.g. Ahmed Tarek, Omar Adel"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="iou-amount" className="label-base">
                Amount (EGP)
              </label>
              <input
                id="iou-amount"
                type="number"
                inputMode="decimal"
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
              <label htmlFor="iou-due" className="label-base">
                Due Date (Optional)
              </label>
              <input
                id="iou-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label htmlFor="iou-account" className="label-base">
              Linked Account
            </label>
            {accounts.length === 0 ? (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                Add an account first to record an IOU.
              </p>
            ) : (
              <select
                id="iou-account"
                value={formAccountId}
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
            )}
          </div>

          <div>
            <label htmlFor="iou-note" className="label-base">
              Note / Reason
            </label>
            <input
              id="iou-note"
              type="text"
              placeholder="e.g. Dinner split, emergency loan"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-base"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={deductFromAccount}
              onChange={(e) => setDeductFromAccount(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-white/70">
              {type === "lent"
                ? "Deduct money from account now (keeps account balance accurate)"
                : "Add borrowed cash to account balance now"}
            </span>
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={!!settlingIou}
        onClose={() => setSettlingIouId(null)}
        title="Settle IOU / تسوية السداد"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setSettlingIouId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSettleSubmit}
              disabled={!resolvedSettleAccountId}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Confirm Settlement
            </Button>
          </div>
        }
      >
        {settlingIou && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                settlingIou.type === "lent"
                  ? "bg-emerald-500/10 border-emerald-500/25"
                  : "bg-rose-500/10 border-rose-500/25",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {settlingIou.personName}
                </p>
                <p className="text-xs text-white/50">
                  {settlingIou.type === "lent"
                    ? "Pays you back"
                    : "You pay back"}
                </p>
              </div>
              <span
                className={cn(
                  "font-mono font-bold tabular-nums text-sm flex-shrink-0",
                  settlingIou.type === "lent"
                    ? "text-emerald-400"
                    : "text-rose-400",
                  blur,
                )}
              >
                {formatCurrency(settlingIou.amount, "EGP")}
              </span>
            </div>

            <div>
              <label htmlFor="iou-settle-account" className="label-base">
                {settlingIou.type === "lent"
                  ? "Deposit into account"
                  : "Pay from account"}
              </label>
              <select
                id="iou-settle-account"
                value={resolvedSettleAccountId}
                onChange={(e) => setSettleAccountId(e.target.value)}
                className="input-base"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#111827]">
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-white/40 mt-1.5">
                A transaction is logged and the account balance updates
                automatically.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deletingIou}
        onClose={() => setDeletingIouId(null)}
        title="Delete IOU?"
        size="sm"
        footer={
          <div className="flex flex-col gap-2">
            {deletingIou?.status === "pending" && (
              <Button
                variant="danger"
                onClick={() => {
                  deleteIou(deletingIou.id, true);
                  setDeletingIouId(null);
                }}
              >
                Delete &amp; undo balance changes
              </Button>
            )}
            <Button
              variant={deletingIou?.status === "pending" ? "ghost" : "danger"}
              onClick={() => {
                if (deletingIou) deleteIou(deletingIou.id, false);
                setDeletingIouId(null);
              }}
            >
              {deletingIou?.status === "pending"
                ? "Delete record only"
                : "Delete"}
            </Button>
            <Button variant="ghost" onClick={() => setDeletingIouId(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        {deletingIou && (
          <p className="text-sm text-white/60">
            {deletingIou.status === "pending"
              ? `Remove the ${deletingIou.type === "lent" ? "lent" : "borrowed"} record for ${deletingIou.personName}. You can also reverse the transaction that was logged when it was created, restoring your account balance.`
              : `Remove the settled record for ${deletingIou.personName}. Its transactions stay in your history so your balances remain correct.`}
          </p>
        )}
      </Modal>
    </div>
  );
}
