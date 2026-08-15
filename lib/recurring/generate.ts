import { addDays, addMonths, addYears, format, parseISO } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RecurringTransaction } from "@/types/database";

// Safety cap on how many missed occurrences we catch up per template in a
// single run (e.g. if the cron didn't run for a while).
const MAX_CATCH_UP_OCCURRENCES = 24;

function nextOccurrenceAfter(
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

export interface RecurringGenerationResult {
  scanned: number;
  created: number;
  failed: number;
}

/**
 * Materializes due recurring transactions into real transactions and
 * advances their next_occurrence. Meant to run daily from a cron trigger.
 */
export async function runRecurringGenerationJob(): Promise<RecurringGenerationResult> {
  const supabase = createSupabaseAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: recurring, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("active", true)
    .lte("next_occurrence", today);
  if (error) throw error;

  const result: RecurringGenerationResult = { scanned: recurring?.length ?? 0, created: 0, failed: 0 };

  for (const r of (recurring ?? []) as RecurringTransaction[]) {
    try {
      let occurrence = r.next_occurrence;
      let iterations = 0;

      while (occurrence <= today && iterations < MAX_CATCH_UP_OCCURRENCES) {
        const { error: insertError } = await supabase.from("transactions").insert({
          user_id: r.user_id,
          account_id: r.account_id,
          category_id: r.category_id,
          type: r.type,
          amount_cents: r.amount_cents,
          description: r.name,
          transaction_date: occurrence,
          is_recurring: true,
          recurring_transaction_id: r.id,
        });
        if (insertError) throw insertError;

        result.created++;
        occurrence = format(nextOccurrenceAfter(parseISO(occurrence), r), "yyyy-MM-dd");
        iterations++;
      }

      const { error: updateError } = await supabase
        .from("recurring_transactions")
        .update({ next_occurrence: occurrence })
        .eq("id", r.id);
      if (updateError) throw updateError;
    } catch (err) {
      result.failed++;
      console.error(`Recurring generation failed for ${r.id}`, err);
    }
  }

  return result;
}
