import { format, subDays } from "date-fns";

export interface LoggingStreak {
  streak: number;
  loggedToday: boolean;
}

/**
 * Consecutive days (ending today) with at least one transaction recorded.
 * If nothing was logged yet today, the streak is still counted as "alive"
 * up to yesterday so the user has until end of day to keep it going.
 */
export function computeLoggingStreak(transactionDates: string[], now: Date = new Date()): LoggingStreak {
  const iso = (d: Date) => format(d, "yyyy-MM-dd");
  const days = new Set(transactionDates);
  const loggedToday = days.has(iso(now));

  let streak = 0;
  let cursor = loggedToday ? now : subDays(now, 1);
  while (days.has(iso(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }

  return { streak, loggedToday };
}
