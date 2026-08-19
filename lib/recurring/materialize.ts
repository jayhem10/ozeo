import { format, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecurringTransaction } from "@/types/database";
import { nextOccurrenceAfter } from "@/lib/recurring/schedule";

// Safety cap on how many missed occurrences we catch up per template in a
// single run (e.g. if the cron didn't run for a while).
const MAX_CATCH_UP_OCCURRENCES = 24;

export interface MaterializeResult {
  created: number;
  nextOccurrence: string;
}

/**
 * Inserts a real transaction for every due occurrence (today or earlier) of a
 * recurring template and returns the advanced next_occurrence. Used both by
 * the nightly cron and immediately when a recurring template is created/edited
 * with a due date, so the account balance doesn't wait until the next cron run.
 */
export async function materializeDueOccurrences(
  supabase: SupabaseClient,
  recurring: Pick<
    RecurringTransaction,
    "id" | "user_id" | "account_id" | "category_id" | "type" | "amount_cents" | "name" | "frequency" | "interval_days" | "next_occurrence"
  >
): Promise<MaterializeResult> {
  const today = format(new Date(), "yyyy-MM-dd");
  let occurrence = recurring.next_occurrence;
  let created = 0;
  let iterations = 0;

  while (occurrence <= today && iterations < MAX_CATCH_UP_OCCURRENCES) {
    // Upsert + ignoreDuplicates makes this idempotent: re-editing a recurring
    // template's date or re-toggling it active won't create duplicate
    // transactions for an occurrence that was already materialized.
    const { data, error } = await supabase
      .from("transactions")
      .upsert(
        {
          user_id: recurring.user_id,
          account_id: recurring.account_id,
          category_id: recurring.category_id,
          type: recurring.type,
          amount_cents: recurring.amount_cents,
          description: recurring.name,
          transaction_date: occurrence,
          is_recurring: true,
          recurring_transaction_id: recurring.id,
        },
        { onConflict: "recurring_transaction_id,transaction_date", ignoreDuplicates: true }
      )
      .select("id");
    if (error) throw error;

    if (data && data.length > 0) created++;
    occurrence = format(nextOccurrenceAfter(parseISO(occurrence), recurring), "yyyy-MM-dd");
    iterations++;
  }

  return { created, nextOccurrence: occurrence };
}
