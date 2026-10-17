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

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
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

    const startLabel = cycleStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endLabel = cycleEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
      isDateInCycle: (dateStr: string) => dateStr >= startIso && dateStr <= endIso,
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
  const maxDaysInNextMonth = new Date(nextCycleYear, nextCycleMonth + 1, 0).getDate();
  const nextActualStartDay = Math.min(clampedStartDay, maxDaysInNextMonth);
  const nextCycleStart = new Date(nextCycleYear, nextCycleMonth, nextActualStartDay);

  // Cycle ends the day before nextCycleStart
  const cycleEnd = new Date(nextCycleStart.getFullYear(), nextCycleStart.getMonth(), nextCycleStart.getDate() - 1);

  const startIso = toIso(cycleStart);
  const endIso = toIso(cycleEnd);
  const nextPaydayIso = toIso(nextCycleStart);

  const msPerDay = 864e5;
  const totalDays = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / msPerDay) + 1;

  // Elapsed days from cycleStart to ref
  const todayDate = new Date(year, month, day);
  const elapsedDays = Math.max(1, Math.round((todayDate.getTime() - cycleStart.getTime()) / msPerDay) + 1);
  const currentDayInCycle = Math.min(totalDays, elapsedDays);
  const remainingDays = Math.max(1, totalDays - currentDayInCycle + 1);
  const daysUntilPayday = Math.max(0, Math.round((nextCycleStart.getTime() - todayDate.getTime()) / msPerDay));

  const startLabel = cycleStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = cycleEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
    isDateInCycle: (dateStr: string) => dateStr >= startIso && dateStr <= endIso,
  };
}
