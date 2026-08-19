import { addDays, addMonths, addYears } from "date-fns";
import type { RecurringTransaction } from "@/types/database";

export function nextOccurrenceAfter(
  current: Date,
  recurring: Pick<RecurringTransaction, "frequency" | "interval_days">
): Date {
  switch (recurring.frequency) {
    case "weekly":
      return addDays(current, 7);
    case "yearly":
      return addYears(current, 1);
    case "custom":
      return addDays(current, recurring.interval_days ?? 30);
    case "monthly":
    default:
      return addMonths(current, 1);
  }
}
