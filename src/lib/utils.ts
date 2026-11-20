import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

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
  const d = parseLocalDate(dateStr);
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
 * Returns the currency in which an account's numeric `balance` field is stored.
 * Foreign-currency and gold vaults store `balance` in base currency (EGP), while
 * standard accounts store `balance` in their own `currency`.
 */
export function getAccountBalanceCurrency(
  acc:
    | { currency: string; assetType?: string; exchangeRateToBase?: number }
    | undefined,
  base = "EGP",
): string {
  if (!acc) return base;
  if (acc.assetType && acc.assetType !== "standard" && acc.exchangeRateToBase) {
    return base;
  }
  return acc.currency || base;
}

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "SAR":
      return "SAR";
    case "AED":
      return "AED";
    default:
      return currency || "EGP";
  }
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

/**
 * Converts an amount from `fromAcc`'s balance currency into `toAcc`'s balance currency.
 */
export function convertTransferAmount(
  amount: number,
  fromAcc:
    | { currency: string; assetType?: string; exchangeRateToBase?: number }
    | undefined,
  toAcc:
    | { currency: string; assetType?: string; exchangeRateToBase?: number }
    | undefined,
  rates: Record<string, number>,
  base = "EGP",
): number {
  const fromCur = getAccountBalanceCurrency(fromAcc, base);
  const toCur = getAccountBalanceCurrency(toAcc, base);
  if (fromCur === toCur) return amount;

  const inBase = amountInBase(amount, fromAcc, rates, base);
  if (toCur === base) return Math.round(inBase * 100) / 100;
  const toRate = rates[toCur];
  if (toRate && toRate > 0) {
    return Math.round((inBase / toRate) * 100) / 100;
  }
  return amount;
}

/** Hashes a 4-digit PIN using SHA-256 (with safe deterministic fallback if subtle crypto is unavailable). */
export async function hashPin(pin: string): Promise<string> {
  const salted = `walleteer-pin-v1:${pin}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const data = new TextEncoder().encode(salted);
      const buf = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Fall through to deterministic fallback
    }
  }
  let h = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv-${(h >>> 0).toString(16)}`;
}

/**
 * Exports text content cleanly on both desktop browsers and mobile/Capacitor WebViews.
 * - On Native Android/iOS: writes the file to the native cache directory and triggers the native OS Share/Save sheet
 *   so the user can save to device Downloads/Files, Drive, WhatsApp, email, or any file manager.
 * - On Mobile Web: leverages the Web Share API with file attachments where available.
 * - On Desktop Web: downloads the file via dynamic anchor tag.
 */
export async function shareOrDownloadFile(
  content: string,
  filename: string,
  mimeType: string,
): Promise<"shared" | "downloaded"> {
  // 1. Native Mobile (Capacitor Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const written = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: filename,
        text: `SubWise backup: ${filename}`,
        url: written.uri,
        dialogTitle: "Save or Share Backup",
      });

      return "shared";
    } catch (err) {
      console.warn("[shareOrDownloadFile] Native share failed, trying Documents write fallback:", err);
      try {
        await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return "downloaded";
      } catch (writeErr) {
        console.error("[shareOrDownloadFile] Filesystem write fallback failed:", writeErr);
      }
    }
  }

  // 2. Web Mobile with Web Share API (Safari iOS, Chrome Android on web)
  const blob = new Blob([content], { type: mimeType });
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && typeof navigator !== "undefined" && "share" in navigator) {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: filename });
        return "shared";
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared";
      }
    }
  }

  // 3. Desktop / Browser download via anchor tag
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
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
