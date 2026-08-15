import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAccounts, getTotalBalance } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getBudgets } from "@/lib/data/budgets";
import { getTransactionsInRange } from "@/lib/data/transactions";
import {
  computeBudgetProgress,
  computePeriodTotals,
  getMonthRange,
  percentChange,
} from "@/lib/calculations/budget";
import { computeLoggingStreak } from "@/lib/calculations/streak";
import { formatMoney } from "@/lib/money";
import { sendEmail } from "@/lib/email/brevo";
import type { Profile } from "@/types/database";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface WeeklyEmail {
  subject: string;
  html: string;
}

/** Builds the personalized weekly recap email for one user, or null if they have no recent activity to report. */
export async function buildWeeklySummaryEmail(
  supabase: SupabaseClient,
  profile: Profile
): Promise<WeeklyEmail | null> {
  const now = new Date();
  const iso = (d: Date) => format(d, "yyyy-MM-dd");
  const weekStart = subDays(now, 6);
  const prevWeekStart = subDays(now, 13);
  const prevWeekEnd = subDays(now, 7);
  const { start: monthStart, end: monthEnd } = getMonthRange(now);

  const [accounts, categories, budgets, weekTx, prevWeekTx, monthTx, last30DaysTx] = await Promise.all([
    getAccounts(supabase, profile.id),
    getCategories(supabase, profile.id),
    getBudgets(supabase, profile.id),
    getTransactionsInRange(supabase, profile.id, iso(weekStart), iso(now)),
    getTransactionsInRange(supabase, profile.id, iso(prevWeekStart), iso(prevWeekEnd)),
    getTransactionsInRange(supabase, profile.id, iso(monthStart), iso(monthEnd)),
    getTransactionsInRange(supabase, profile.id, iso(subDays(now, 29)), iso(now)),
  ]);

  // Don't email users with no activity in the last two weeks — nothing useful to say.
  if (weekTx.length === 0 && prevWeekTx.length === 0) return null;

  const currency = profile.currency ?? "EUR";
  const totalBalance = await getTotalBalance(accounts);
  const totals = computePeriodTotals(weekTx);
  const prevTotals = computePeriodTotals(prevWeekTx);
  const expenseChange = percentChange(totals.expenseCents, prevTotals.expenseCents);
  const { streak, loggedToday } = computeLoggingStreak(
    last30DaysTx.map((t) => t.transaction_date),
    now
  );

  const categoryTotals = new Map<string, number>();
  for (const t of weekTx) {
    if (t.type !== "expense") continue;
    const key = t.category_id ?? "uncategorized";
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + t.amount_cents);
  }
  const topCategoryEntry = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCategoryEntry ? categories.find((c) => c.id === topCategoryEntry[0]) : null;

  const budgetWarnings = budgets
    .map((b) => {
      const category = categories.find((c) => c.id === b.category_id);
      if (!category) return null;
      const spent = monthTx
        .filter((t) => t.type === "expense" && t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount_cents, 0);
      const progress = computeBudgetProgress(b, spent, monthStart, monthEnd, now);
      return { category, progress };
    })
    .filter(
      (b): b is NonNullable<typeof b> => b !== null && (b.progress.pace === "at_risk" || b.progress.pace === "over")
    );

  const firstName = profile.full_name?.split(" ")[0];
  const periodLabel = `${format(weekStart, "d MMM", { locale: fr })} – ${format(now, "d MMM", { locale: fr })}`;

  const rows: string[] = [];
  rows.push(row("Solde disponible", formatMoney(totalBalance, currency)));
  rows.push(
    row(
      "Dépenses de la semaine",
      formatMoney(totals.expenseCents, currency),
      expenseChange !== null
        ? `${expenseChange >= 0 ? "↑" : "↓"} ${Math.abs(Math.round(expenseChange * 100))} % vs semaine dernière`
        : undefined
    )
  );
  rows.push(row("Revenus de la semaine", formatMoney(totals.incomeCents, currency)));
  if (topCategory) {
    rows.push(row(`Plus grosse dépense : ${topCategory.name}`, formatMoney(topCategoryEntry![1], currency)));
  }

  const warningsHtml = budgetWarnings.length
    ? `<div style="margin-top:20px;padding:16px;border-radius:12px;background:#fef2f2;border:1px solid #fecaca;">
        <p style="margin:0 0 8px;font-weight:600;color:#b91c1c;">Budgets à surveiller</p>
        ${budgetWarnings
          .map(
            (b) =>
              `<p style="margin:0 0 4px;font-size:14px;color:#7f1d1d;">${b.category.name} — ${Math.round(
                b.progress.progressRatio * 100
              )} % utilisé${b.progress.pace === "over" ? " (dépassé)" : ""}</p>`
          )
          .join("")}
      </div>`
    : "";

  const streakHtml =
    streak > 0
      ? `<p style="margin:16px 0 0;font-size:14px;color:#ea580c;">🔥 ${streak} jour${streak > 1 ? "s" : ""} d'affilée${
          loggedToday ? "" : " — ajoute une transaction aujourd'hui pour continuer !"
        }</p>`
      : "";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a;">
      <p style="font-size:13px;color:#64748b;margin:0 0 4px;">Ozeo — récap de la semaine</p>
      <h1 style="font-size:20px;margin:0 0 4px;">Salut${firstName ? ` ${firstName}` : ""} 👋</h1>
      <p style="font-size:13px;color:#64748b;margin:0 0 20px;">${periodLabel}</p>
      <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        ${rows.join("")}
      </div>
      ${warningsHtml}
      ${streakHtml}
      <a href="${SITE_URL}/dashboard" style="display:inline-block;margin-top:24px;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        Voir mon dashboard
      </a>
    </div>
  `;

  return { subject: `Ton récap Ozeo — ${periodLabel}`, html };
}

function row(label: string, value: string, sub?: string): string {
  return `<div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
    <p style="margin:0;font-size:13px;color:#64748b;">${label}</p>
    <p style="margin:2px 0 0;font-size:18px;font-weight:600;">${value}</p>
    ${sub ? `<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${sub}</p>` : ""}
  </div>`;
}

export interface WeeklySummaryResult {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
}

/** Sends the weekly recap email to every user with recent activity. Meant to run from a weekly cron trigger. */
export async function runWeeklySummaryJob(): Promise<WeeklySummaryResult> {
  const supabase = createSupabaseAdminClient();
  const { data: profiles, error } = await supabase.from("profiles").select("*").not("email", "is", null);
  if (error) throw error;

  const result: WeeklySummaryResult = { total: profiles?.length ?? 0, sent: 0, skipped: 0, failed: 0 };

  for (const profile of (profiles ?? []) as Profile[]) {
    try {
      const email = await buildWeeklySummaryEmail(supabase, profile);
      if (!email) {
        result.skipped++;
        continue;
      }
      await sendEmail({
        to: [{ email: profile.email!, name: profile.full_name ?? undefined }],
        subject: email.subject,
        html: email.html,
      });
      result.sent++;
    } catch (err) {
      result.failed++;
      console.error(`Weekly summary email failed for user ${profile.id}`, err);
    }
  }

  return result;
}
