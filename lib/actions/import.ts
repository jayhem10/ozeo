"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { suggestCategoryId } from "@/lib/categorization";
import { toCents } from "@/lib/money";
import type { ActionResult } from "@/lib/actions/transactions";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return { supabase, user };
}

export interface CsvImportRow {
  date: string; // ISO yyyy-MM-dd, already normalized client-side
  amount: number; // positive = income, negative = expense
  description?: string;
  merchant?: string;
}

export interface ImportSummary {
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  failedRows: number;
}

export type ImportActionResult = ActionResult & { summary?: ImportSummary };

export async function importTransactions(
  filename: string,
  accountId: string,
  rows: CsvImportRow[]
): Promise<ImportActionResult> {
  const { supabase, user } = await requireUser();

  if (!accountId || rows.length === 0) {
    return { success: false, error: "Aucune ligne à importer" };
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.eq.${user.id},user_id.is.null`);

  const { data: merchantRules } = await supabase
    .from("merchant_rules")
    .select("*")
    .eq("user_id", user.id);

  const { data: existing } = await supabase
    .from("transactions")
    .select("transaction_date, amount_cents, merchant")
    .eq("user_id", user.id)
    .eq("account_id", accountId);

  const existingKeys = new Set(
    (existing ?? []).map((t) => `${t.transaction_date}|${t.amount_cents}|${t.merchant ?? ""}`)
  );

  const { data: importRecord, error: importError } = await supabase
    .from("imports")
    .insert({ user_id: user.id, filename, source: "csv", total_rows: rows.length })
    .select()
    .single();
  if (importError || !importRecord) {
    return { success: false, error: importError?.message ?? "Import impossible" };
  }

  let importedRows = 0;
  let duplicateRows = 0;
  let failedRows = 0;

  for (const row of rows) {
    const amountCents = toCents(Math.abs(row.amount));
    const merchant = row.merchant || row.description || null;
    const key = `${row.date}|${amountCents}|${merchant ?? ""}`;

    if (!row.date || !row.amount || Number.isNaN(row.amount)) {
      failedRows += 1;
      await supabase.from("imported_transactions").insert({
        user_id: user.id,
        import_id: importRecord.id,
        raw_data: row,
        status: "failed",
      });
      continue;
    }

    if (existingKeys.has(key)) {
      duplicateRows += 1;
      await supabase.from("imported_transactions").insert({
        user_id: user.id,
        import_id: importRecord.id,
        raw_data: row,
        status: "duplicate",
      });
      continue;
    }

    const categoryId = suggestCategoryId(merchant, categories ?? [], merchantRules ?? []);
    const { data: created, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: accountId,
        category_id: categoryId,
        type: row.amount >= 0 ? "income" : "expense",
        amount_cents: amountCents,
        description: row.description || null,
        merchant,
        transaction_date: row.date,
      })
      .select()
      .single();

    if (insertError || !created) {
      failedRows += 1;
      await supabase.from("imported_transactions").insert({
        user_id: user.id,
        import_id: importRecord.id,
        raw_data: row,
        status: "failed",
      });
      continue;
    }

    importedRows += 1;
    existingKeys.add(key);
    await supabase.from("imported_transactions").insert({
      user_id: user.id,
      import_id: importRecord.id,
      raw_data: row,
      status: "imported",
      transaction_id: created.id,
    });
  }

  await supabase
    .from("imports")
    .update({ imported_rows: importedRows, failed_rows: failedRows })
    .eq("id", importRecord.id);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/import");

  return {
    success: true,
    summary: { totalRows: rows.length, importedRows, duplicateRows, failedRows },
  };
}
