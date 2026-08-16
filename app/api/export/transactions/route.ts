import ExcelJS from "exceljs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fromCents } from "@/lib/money";
import type { Account, Category, Transaction } from "@/types/database";

const TYPE_LABELS: Record<Transaction["type"], string> = {
  expense: "Dépense",
  income: "Revenu",
  transfer: "Virement",
};

function isValidDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!isValidDate(from) || !isValidDate(to)) {
    return new Response("Paramètres from/to invalides (format attendu yyyy-MM-dd)", { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Non authentifié", { status: 401 });

  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(*), account:accounts(*)")
    .eq("user_id", user.id)
    .gte("transaction_date", from)
    .lte("transaction_date", to)
    .order("transaction_date", { ascending: true });

  if (error) return new Response(error.message, { status: 500 });

  const transactions = (data ?? []) as (Transaction & {
    category: Category | null;
    account: Account;
  })[];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transactions");

  sheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Type", key: "type", width: 12 },
    { header: "Catégorie", key: "category", width: 20 },
    { header: "Compte", key: "account", width: 20 },
    { header: "Marchand", key: "merchant", width: 24 },
    { header: "Note", key: "description", width: 30 },
    { header: "Montant", key: "amount", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  let totalExpense = 0;
  let totalIncome = 0;

  for (const t of transactions) {
    const signedCents = t.type === "expense" ? -t.amount_cents : t.amount_cents;
    if (t.type === "expense") totalExpense += t.amount_cents;
    if (t.type === "income") totalIncome += t.amount_cents;

    sheet.addRow({
      date: t.transaction_date,
      type: TYPE_LABELS[t.type],
      category: t.category?.name ?? "Sans catégorie",
      account: t.account.name,
      merchant: t.merchant ?? "",
      description: t.description ?? "",
      amount: fromCents(signedCents),
    });
  }

  sheet.getColumn("amount").numFmt = "#,##0.00 €";

  sheet.addRow({});
  const netRow = sheet.addRow({ description: "Net", amount: fromCents(totalIncome - totalExpense) });
  netRow.font = { bold: true };
  netRow.getCell("amount").numFmt = "#,##0.00 €";

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="transactions_${from}_${to}.xlsx"`,
    },
  });
}
