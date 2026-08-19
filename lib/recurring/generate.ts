import { format } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RecurringTransaction } from "@/types/database";
import { materializeDueOccurrences } from "@/lib/recurring/materialize";

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
      const { created, nextOccurrence } = await materializeDueOccurrences(supabase, r);
      result.created += created;

      const { error: updateError } = await supabase
        .from("recurring_transactions")
        .update({ next_occurrence: nextOccurrence })
        .eq("id", r.id);
      if (updateError) throw updateError;
    } catch (err) {
      result.failed++;
      console.error(`Recurring generation failed for ${r.id}`, err);
    }
  }

  return result;
}
