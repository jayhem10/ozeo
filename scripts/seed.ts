/**
 * Dev-only seed script — creates a demo user with realistic data so the
 * dashboard, budgets, goals and analytics are interesting immediately.
 *
 * Usage: npm run seed
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { subDays, subMonths, format } from "date-fns";

const SEED_EMAIL = process.env.SEED_USER_EMAIL ?? "demo@ozeo.local";
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD ?? "demo-password-123!";

function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment");
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log(`Seeding demo user ${SEED_EMAIL}…`);

  const { data: existing } = await admin.auth.admin.listUsers();
  let userId = existing.users.find((u) => u.email === SEED_EMAIL)?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Alex Demo" },
    });
    if (error || !data.user) throw error ?? new Error("Failed to create demo user");
    userId = data.user.id;
  }

  await admin
    .from("profiles")
    .update({ onboarding_completed: true, monthly_budget_cents: 200000, full_name: "Alex Demo" })
    .eq("id", userId);

  // Accounts
  const accountsToCreate = [
    { name: "Compte courant", type: "checking", initial_balance_cents: 150000, icon: "Wallet", color: "#6366f1" },
    { name: "Épargne", type: "savings", initial_balance_cents: 500000, icon: "PiggyBank", color: "#22c55e" },
    { name: "Espèces", type: "cash", initial_balance_cents: 8000, icon: "Banknote", color: "#eab308" },
  ] as const;

  const { data: existingAccounts } = await admin.from("accounts").select("*").eq("user_id", userId);
  const accounts = existingAccounts && existingAccounts.length > 0 ? existingAccounts : [];

  if (accounts.length === 0) {
    for (const a of accountsToCreate) {
      const { data } = await admin
        .from("accounts")
        .insert({ user_id: userId, ...a, current_balance_cents: a.initial_balance_cents })
        .select()
        .single();
      if (data) accounts.push(data);
    }
  }
  const mainAccount = accounts[0];

  const { data: categories } = await admin.from("categories").select("*").is("user_id", null);
  const categoryByName = new Map((categories ?? []).map((c) => [c.name, c]));

  // Budgets for a few categories
  const budgetPlan: Record<string, number> = {
    Restaurants: 40000,
    Courses: 35000,
    Transport: 20000,
    Loisirs: 15000,
    Logement: 120000,
  };
  const { data: existingBudgets } = await admin.from("budgets").select("id").eq("user_id", userId);
  if (!existingBudgets || existingBudgets.length === 0) {
    for (const [name, amount] of Object.entries(budgetPlan)) {
      const category = categoryByName.get(name);
      if (!category) continue;
      await admin.from("budgets").insert({
        user_id: userId,
        category_id: category.id,
        amount_cents: amount,
        period: "monthly",
        start_date: iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      });
    }
  }

  // Recurring transactions
  const { data: existingRecurring } = await admin.from("recurring_transactions").select("id").eq("user_id", userId);
  if (!existingRecurring || existingRecurring.length === 0) {
    const recurringPlan = [
      { name: "Netflix", amount_cents: 1999, category: "Abonnements" },
      { name: "Spotify", amount_cents: 1112, category: "Abonnements" },
      { name: "Loyer", amount_cents: 110000, category: "Logement" },
      { name: "Assurance", amount_cents: 4200, category: "Autre" },
    ];
    for (const r of recurringPlan) {
      const category = categoryByName.get(r.category);
      await admin.from("recurring_transactions").insert({
        user_id: userId,
        account_id: mainAccount.id,
        category_id: category?.id ?? null,
        name: r.name,
        amount_cents: r.amount_cents,
        type: "expense",
        frequency: "monthly",
        next_occurrence: iso(subDays(new Date(), -Math.floor(Math.random() * 20))),
      });
    }
    const salaryCategory = categoryByName.get("Salaire");
    await admin.from("recurring_transactions").insert({
      user_id: userId,
      account_id: mainAccount.id,
      category_id: salaryCategory?.id ?? null,
      name: "Salaire",
      amount_cents: 320000,
      type: "income",
      frequency: "monthly",
      next_occurrence: iso(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 28)),
    });
  }

  // Savings goals
  const { data: existingGoals } = await admin.from("savings_goals").select("id").eq("user_id", userId);
  if (!existingGoals || existingGoals.length === 0) {
    await admin.from("savings_goals").insert([
      {
        user_id: userId,
        name: "Voyage au Japon",
        target_amount_cents: 300000,
        current_amount_cents: 185000,
        target_date: iso(subMonths(new Date(), -7)),
        icon: "Plane",
        color: "#0ea5e9",
        monthly_contribution_cents: 25000,
      },
      {
        user_id: userId,
        name: "Fonds d'urgence",
        target_amount_cents: 500000,
        current_amount_cents: 320000,
        icon: "ShieldCheck",
        color: "#22c55e",
        monthly_contribution_cents: 20000,
      },
    ]);
  }

  // Transactions across the last 3 months
  const { data: existingTx } = await admin.from("transactions").select("id").eq("user_id", userId).limit(1);
  if (!existingTx || existingTx.length === 0) {
    const merchantsByCategory: Record<string, string[]> = {
      Restaurants: ["McDonald's", "Le Bistrot", "Deliveroo", "Pizza Express"],
      Courses: ["Carrefour", "Monoprix", "Lidl"],
      Transport: ["SNCF", "Uber", "RATP"],
      Carburant: ["Total", "Shell"],
      Loisirs: ["Cinéma Pathé", "Steam", "Fnac"],
      Shopping: ["Zara", "Amazon", "Decathlon"],
      Santé: ["Pharmacie du Centre"],
      Abonnements: ["Netflix", "Spotify"],
    };

    const rows: Record<string, unknown>[] = [];
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
      const date = subDays(new Date(), dayOffset);
      const transactionsPerDay = Math.random() < 0.6 ? 1 : Math.random() < 0.8 ? 2 : 0;
      for (let i = 0; i < transactionsPerDay; i++) {
        const categoryNames = Object.keys(merchantsByCategory);
        const categoryName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
        const category = categoryByName.get(categoryName);
        const merchants = merchantsByCategory[categoryName];
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        const baseAmount = categoryName === "Loisirs" ? 3000 : categoryName === "Courses" ? 6000 : 1500;
        const amount = baseAmount + Math.floor(Math.random() * baseAmount);
        rows.push({
          user_id: userId,
          account_id: mainAccount.id,
          category_id: category?.id ?? null,
          type: "expense",
          amount_cents: amount,
          merchant,
          transaction_date: iso(date),
        });
      }
    }
    // Monthly salary for the last 3 months
    const salaryCategory = categoryByName.get("Salaire");
    for (let m = 0; m < 3; m++) {
      rows.push({
        user_id: userId,
        account_id: mainAccount.id,
        category_id: salaryCategory?.id ?? null,
        type: "income",
        amount_cents: 320000,
        merchant: "Employeur SAS",
        transaction_date: iso(subMonths(new Date(new Date().getFullYear(), new Date().getMonth(), 28), m)),
      });
    }

    const { error } = await admin.from("transactions").insert(rows);
    if (error) throw error;
    console.log(`Inserted ${rows.length} transactions`);
  }

  console.log("Seed complete.");
  console.log(`Login: ${SEED_EMAIL} / ${SEED_PASSWORD} (use Supabase dashboard to sign in as this user, or adapt for local password auth)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
