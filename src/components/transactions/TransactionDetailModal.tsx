import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Hash,
  Pencil,
  Repeat,
  Scale,
  Tag,
  Trash2,
  Users2,
  Wallet,
  X,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useToastStore } from "../../store/useToastStore";
import { cn, formatCurrency, formatFullDate, todayISO } from "../../lib/utils";
import type { Account, Transaction } from "../../types";
import { AddTransactionModal } from "./AddTransactionModal";
import {
  TX_TYPE_META,
  getCategoryColor,
  getCategoryIcon,
} from "./transactionMeta";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

function accountCurrency(acc?: Account) {
  return acc?.exchangeRateToBase ? "EGP" : (acc?.currency ?? "EGP");
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2 text-xs text-white/45 flex-shrink-0">
        <span className="text-white/30">{icon}</span>
        {label}
      </div>
      <div className="text-xs font-medium text-white text-right min-w-0">
        {children}
      </div>
    </div>
  );
}

function AccountChip({
  account,
  align = "left",
  privacyMode,
}: {
  account?: Account;
  align?: "left" | "right";
  privacyMode: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2",
        align === "right" && "text-right",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          align === "right" && "justify-end",
        )}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: account?.color ?? "#64748b" }}
        />
        <p className="text-xs font-semibold text-white truncate">
          {account?.name ?? "Deleted account"}
        </p>
      </div>
      {account && (
        <p
          className={cn(
            "text-[10px] font-mono text-white/40 mt-0.5 truncate",
            privacyMode && "privacy-blur",
          )}
        >
          {formatCurrency(account.balance, accountCurrency(account))}
        </p>
      )}
    </div>
  );
}

export function TransactionDetailModal({ transaction, onClose }: Props) {
  const accounts = useStore((s) => s.accounts);
  const getAccountById = (id: string) => accounts.find((a) => a.id === id);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const addTransaction = useStore((s) => s.addTransaction);
  const privacyMode = useStore((s) => s.privacyMode);
  const addToast = useToastStore((s) => s.addToast);

  const [mode, setMode] = useState<"view" | "edit" | "confirmDelete">("view");
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = !!transaction;

  // Reset internal state whenever a different transaction is shown
  useEffect(() => {
    setMode("view");
    setCopied(false);
  }, [transaction?.id]);

  useEffect(() => {
    if (!isOpen || mode === "edit") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mode === "confirmDelete") setMode("view");
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, [isOpen, mode, onClose]);

  if (!transaction) return null;

  if (mode === "edit") {
    return (
      <AddTransactionModal editTransaction={transaction} onClose={onClose} />
    );
  }

  const tx = transaction;
  const meta = TX_TYPE_META[tx.type];
  const fromAcc = getAccountById(tx.accountId);
  const toAcc = tx.toAccountId ? getAccountById(tx.toAccountId) : undefined;
  const currency = fromAcc?.currency || "EGP";
  const catColor = getCategoryColor(tx);
  const CategoryIcon = getCategoryIcon(tx.category, tx.type);
  const title = tx.note || tx.category;
  const reference = tx.id.slice(-8).toUpperCase();
  const addedAt = new Date(tx.createdAt);

  const handleDuplicate = () => {
    addTransaction({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      note: tx.note ? `${tx.note} (Copy)` : "Copy",
      date: todayISO(),
      accountId: tx.accountId,
      toAccountId: tx.toAccountId,
      isRecurring: false,
    });
    addToast({
      type: "success",
      message: `Duplicated "${title}" with today's date`,
      duration: 3500,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteTransaction(tx.id);
    addToast({
      type: "success",
      message: `Deleted "${title}" and reversed its balance effect`,
      duration: 3500,
    });
    onClose();
  };

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(tx.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      addToast({ type: "warning", message: "Couldn't copy to clipboard" });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in pointer-events-none" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Transaction details: ${title}`}
        className="relative z-10 w-full sm:max-w-md max-h-[92dvh] flex flex-col overflow-hidden bg-[#0F1521] border border-white/[0.1] shadow-2xl shadow-black/60 rounded-t-3xl sm:rounded-3xl animate-slide-up"
      >
        {/* Hero */}
        <div className="relative px-5 pt-5 pb-5 flex-shrink-0 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-b pointer-events-none",
              meta.heroGradient,
            )}
          />
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{ backgroundColor: meta.hex }}
          />

          <div className="relative flex items-start justify-between">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                meta.softBg,
                meta.text,
                meta.border,
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {meta.label}
            </span>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-xl text-white/50 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative flex flex-col items-center text-center mt-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center ring-1 ring-white/10 shadow-lg"
              style={{ backgroundColor: `${catColor}26`, color: catColor }}
            >
              <CategoryIcon size={26} />
            </div>
            <p
              className={cn(
                "mt-3 text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tight",
                meta.text,
                privacyMode && "privacy-blur",
              )}
            >
              {meta.sign}
              {formatCurrency(tx.amount, currency)}
            </p>
            <h3 className="mt-1.5 text-sm font-semibold text-white max-w-full truncate px-2">
              {title}
            </h3>
            <p className="text-[11px] text-white/45 mt-0.5">
              {formatFullDate(tx.date)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 overflow-y-auto min-h-0 flex-1 space-y-3">
          {/* Money flow */}
          <div className="flex items-center gap-2">
            <AccountChip account={fromAcc} privacyMode={privacyMode} />
            {toAcc ? (
              <>
                <div className="w-7 h-7 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={13} className="text-sky-400" />
                </div>
                <AccountChip
                  account={toAcc}
                  align="right"
                  privacyMode={privacyMode}
                />
              </>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 divide-y divide-white/[0.05]">
            <DetailRow icon={<Tag size={13} />} label="Category">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] max-w-[200px]"
                style={{ backgroundColor: `${catColor}20`, color: catColor }}
              >
                <span className="truncate">{tx.category}</span>
              </span>
            </DetailRow>
            <DetailRow
              icon={<Wallet size={13} />}
              label={toAcc ? "From account" : "Account"}
            >
              {fromAcc?.name ?? "Deleted account"}
            </DetailRow>
            {toAcc && (
              <DetailRow icon={<Wallet size={13} />} label="To account">
                {toAcc.name}
              </DetailRow>
            )}
            <DetailRow icon={<CalendarDays size={13} />} label="Date">
              {formatFullDate(tx.date)}
            </DetailRow>
            {tx.isRecurring && (
              <DetailRow icon={<Repeat size={13} />} label="Recurring">
                <span className="capitalize text-blue-300">
                  {tx.recurrenceFrequency ?? "Active"}
                  {tx.recurrenceEndDate
                    ? ` · until ${formatFullDate(tx.recurrenceEndDate)}`
                    : ""}
                </span>
              </DetailRow>
            )}
            {tx.parentRecurringId && !tx.isRecurring && (
              <DetailRow icon={<Repeat size={13} />} label="Source">
                <span className="text-blue-300">
                  Auto-generated (recurring)
                </span>
              </DetailRow>
            )}
            {tx.isIou && (
              <DetailRow icon={<Users2 size={13} />} label="Linked to">
                <span className="text-amber-300">IOU record</span>
              </DetailRow>
            )}
            {tx.isReconciliation && (
              <DetailRow icon={<Scale size={13} />} label="Type">
                <span className="text-violet-300">Balance reconciliation</span>
              </DetailRow>
            )}
            <DetailRow icon={<Hash size={13} />} label="Reference">
              <button
                onClick={handleCopyRef}
                className="inline-flex items-center gap-1.5 font-mono text-white/70 hover:text-white transition-colors"
                title="Copy full transaction ID"
              >
                #{reference}
                {copied ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} className="text-white/30" />
                )}
              </button>
            </DetailRow>
          </div>

          <p className="text-[10px] text-white/30 text-center">
            Added{" "}
            {addedAt.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-white/[0.07] flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 bg-[#0C111B]">
          {mode === "confirmDelete" ? (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs text-rose-300/90 text-center">
                Delete this transaction? The balance of the linked account
                {toAcc ? "s" : ""} will be reversed.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setMode("view")}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-semibold text-white/80 border border-white/[0.08] transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button
                onClick={() => setMode("edit")}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-colors flex items-center justify-center gap-2"
              >
                <Pencil size={15} />
                Edit
              </button>
              <button
                onClick={handleDuplicate}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-semibold text-white/85 border border-white/[0.08] transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={15} />
                Duplicate
              </button>
              <button
                onClick={() => setMode("confirmDelete")}
                aria-label="Delete transaction"
                className="px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
