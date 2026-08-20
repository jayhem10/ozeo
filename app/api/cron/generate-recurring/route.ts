import { NextResponse } from "next/server";
import { runRecurringGenerationJob } from "@/lib/recurring/generate";
import { runAccountBalanceRecalcJob } from "@/lib/accounts/recalc-balances";

// Triggered daily by Vercel Cron (see vercel.json). Vercel injects the
// Authorization header automatically when CRON_SECRET is set on the project.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runRecurringGenerationJob();
  await runAccountBalanceRecalcJob();
  return NextResponse.json(result);
}
