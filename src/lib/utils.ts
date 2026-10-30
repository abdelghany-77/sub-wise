import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EGP"): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);
  return `${currency} ${formatted}`;
}

export type DateFormatPref =
  "MMM D, YYYY" | "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
let dateFormatPref: DateFormatPref = "MMM D, YYYY";

/** Called by the app shell whenever the user changes the date-format setting. */
export function setDateFormatPreference(pref: DateFormatPref) {
  dateFormatPref = pref;
}

export function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  switch (dateFormatPref) {
    case "MM/DD/YYYY":
      return `${m}/${d}/${y}`;
    case "DD/MM/YYYY":
      return `${d}/${m}/${y}`;
    case "YYYY-MM-DD":
      return `${y}-${m}-${d}`;
    default:
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  }
}

/** Parses a YYYY-MM-DD string as a local date (avoids UTC off-by-one shifts). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getDateFormatPreference(): DateFormatPref {
  return dateFormatPref;
}

export function formatFullDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  if (dateFormatPref === "MMM D, YYYY") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return `${weekday}, ${formatDate(dateStr)}`;
}

/** "Today", "Yesterday", or "Mon, Oct 27" (or numeric per preference). */
export function formatDayLabel(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (dateFormatPref !== "MMM D, YYYY") {
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${weekday}, ${formatDate(dateStr)}`;
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Formats a Date as YYYY-MM-DD using the *local* calendar day. */
export function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayISO(): string {
  return toLocalISO(new Date());
}

/** Local YYYY-MM-DD for today shifted by `days` (negative = past). */
export function addDaysISO(days: number, from: Date = new Date()): string {
  const d = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() + days,
  );
  return toLocalISO(d);
}

/**
 * Adds one recurrence period to a YYYY-MM-DD date. Month/year jumps clamp to the
 * last day of the target month and honour `anchorDay` so Jan 31 -> Feb 28 -> Mar 31.
 */
export function nextRecurrenceDate(
  lastDate: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  anchorDay?: number,
): string {
  const d = parseLocalDate(lastDate);
  const anchor = anchorDay ?? d.getDate();
  if (frequency === "daily")
    return toLocalISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  if (frequency === "weekly")
    return toLocalISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  const monthsToAdd = frequency === "monthly" ? 1 : 12;
  const target = new Date(d.getFullYear(), d.getMonth() + monthsToAdd, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return toLocalISO(
    new Date(
      target.getFullYear(),
      target.getMonth(),
      Math.min(anchor, lastDay),
    ),
  );
}

/**
 * Balance of an account expressed in the base currency (EGP). Foreign-currency
 * and gold vaults already store their balance in base; plain accounts held in
 * another currency are converted with the stored exchange rates.
 */
export function amountInBase(
  amount: number,
  acc:
    | { currency: string; assetType?: string; exchangeRateToBase?: number }
    | undefined,
  rates: Record<string, number>,
  base = "EGP",
): number {
  if (!acc) return amount;
  return accountBalanceInBase({ ...acc, balance: amount }, rates, base);
}

export function accountBalanceInBase(
  acc: {
    balance: number;
    currency: string;
    assetType?: string;
    exchangeRateToBase?: number;
  },
  rates: Record<string, number>,
  base = "EGP",
): number {
  if (acc.assetType && acc.assetType !== "standard" && acc.exchangeRateToBase)
    return acc.balance;
  if (acc.currency && acc.currency !== base && rates[acc.currency]) {
    return acc.balance * rates[acc.currency];
  }
  return acc.balance;
}

export interface FinancialCycle {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startDay: number;
  totalDays: number;
  currentDayInCycle: number;
  remainingDays: number;
  cycleLabel: string; // e.g. "Sep 26 – Oct 25"
  nextPaydayDate: string; // YYYY-MM-DD
  daysUntilPayday: number;
  isDateInCycle: (dateStr: string) => boolean;
}

export function getFinancialCycle(
  referenceDate: Date | string = new Date(),
  startDay = 1,
): FinancialCycle {
  let ref: Date;
  if (typeof referenceDate === "string") {
    const parts = referenceDate.split("-").map(Number);
    ref = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  } else {
    ref = referenceDate;
  }

  const clampedStartDay = Math.min(31, Math.max(1, startDay || 1));
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-indexed
  const day = ref.getDate();

  const toIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
  };

  if (clampedStartDay === 1) {
    const maxDays = new Date(year, month + 1, 0).getDate();
    const cycleStart = new Date(year, month, 1);
    const cycleEnd = new Date(year, month, maxDays);
    const nextPayday = new Date(year, month + 1, 1);

    const startIso = toIso(cycleStart);
    const endIso = toIso(cycleEnd);
    const nextPaydayIso = toIso(nextPayday);
    const remainingDays = Math.max(1, maxDays - day + 1);

    const startLabel = cycleStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endLabel = cycleEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      startDate: startIso,
      endDate: endIso,
      startDay: 1,
      totalDays: maxDays,
      currentDayInCycle: day,
      remainingDays,
      cycleLabel: `${startLabel} – ${endLabel}`,
      nextPaydayDate: nextPaydayIso,
      daysUntilPayday: Math.max(0, maxDays - day + 1),
      isDateInCycle: (dateStr: string) =>
        dateStr >= startIso && dateStr <= endIso,
    };
  }

  // If clampedStartDay > 1:
  let startYear = year;
  let startMonth = month;

  if (day < clampedStartDay) {
    // Current date is before salary day this month, so cycle started in previous month
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = year - 1;
    }
  } else {
    // Current date is on or after salary day this month
    startYear = year;
    startMonth = month;
  }

  // Actual start date clamped to number of days in startMonth
  const maxDaysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const actualStartDay = Math.min(clampedStartDay, maxDaysInStartMonth);
  const cycleStart = new Date(startYear, startMonth, actualStartDay);

  // Next cycle starts in startMonth + 1
  let nextCycleYear = startYear;
  let nextCycleMonth = startMonth + 1;
  if (nextCycleMonth > 11) {
    nextCycleMonth = 0;
    nextCycleYear = startYear + 1;
  }
  const maxDaysInNextMonth = new Date(
    nextCycleYear,
    nextCycleMonth + 1,
    0,
  ).getDate();
  const nextActualStartDay = Math.min(clampedStartDay, maxDaysInNextMonth);
  const nextCycleStart = new Date(
    nextCycleYear,
    nextCycleMonth,
    nextActualStartDay,
  );

  // Cycle ends the day before nextCycleStart
  const cycleEnd = new Date(
    nextCycleStart.getFullYear(),
    nextCycleStart.getMonth(),
    nextCycleStart.getDate() - 1,
  );

  const startIso = toIso(cycleStart);
  const endIso = toIso(cycleEnd);
  const nextPaydayIso = toIso(nextCycleStart);

  const msPerDay = 864e5;
  const totalDays =
    Math.round((cycleEnd.getTime() - cycleStart.getTime()) / msPerDay) + 1;

  // Elapsed days from cycleStart to ref
  const todayDate = new Date(year, month, day);
  const elapsedDays = Math.max(
    1,
    Math.round((todayDate.getTime() - cycleStart.getTime()) / msPerDay) + 1,
  );
  const currentDayInCycle = Math.min(totalDays, elapsedDays);
  const remainingDays = Math.max(1, totalDays - currentDayInCycle + 1);
  const daysUntilPayday = Math.max(
    0,
    Math.round((nextCycleStart.getTime() - todayDate.getTime()) / msPerDay),
  );

  const startLabel = cycleStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel = cycleEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return {
    startDate: startIso,
    endDate: endIso,
    startDay: clampedStartDay,
    totalDays,
    currentDayInCycle,
    remainingDays,
    cycleLabel: `${startLabel} – ${endLabel}`,
    nextPaydayDate: nextPaydayIso,
    daysUntilPayday,
    isDateInCycle: (dateStr: string) =>
      dateStr >= startIso && dateStr <= endIso,
  };
}
