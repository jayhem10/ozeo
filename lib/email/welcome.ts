import { differenceInSeconds } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/brevo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
// Profile row is created by the handle_new_user DB trigger in the same
// request as the very first sign-in, so a fresh profile is always < a few
// seconds old — 60s leaves generous margin without risking false positives
// on returning users.
const NEW_USER_WINDOW_SECONDS = 60;

/** Sends a one-time welcome email right after a user's very first sign-up. Never throws. */
export async function maybeSendWelcomeEmail(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<void> {
  if (!email) return;

  try {
    const { data: profile } = await supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle();
    if (!profile) return;

    const isBrandNew = differenceInSeconds(new Date(), new Date(profile.created_at)) < NEW_USER_WINDOW_SECONDS;
    if (!isBrandNew) return;

    const firstName = profile.full_name?.split(" ")[0];
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a;">
        <p style="font-size:13px;color:#64748b;margin:0 0 4px;">Ozeo</p>
        <h1 style="font-size:20px;margin:0 0 12px;">Bienvenue${firstName ? ` ${firstName}` : ""} 👋</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
          Ton compte est prêt. Ajoute ton premier compte bancaire, crée quelques catégories de budget,
          et commence à suivre tes dépenses en quelques secondes.
        </p>
        <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Configurer mon compte
        </a>
        <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">
          Tu recevras un récap de tes dépenses chaque semaine pour t'aider à garder le cap.
        </p>
      </div>
    `;

    await sendEmail({ to: [{ email, name: profile.full_name ?? undefined }], subject: "Bienvenue sur Ozeo 👋", html });
  } catch (err) {
    console.error("Welcome email failed", err);
  }
}
