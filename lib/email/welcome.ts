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
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
          <tr>
            <td style="width:28px;height:28px;border-radius:8px;background:#6366f1;text-align:center;vertical-align:middle;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
                <path d="M20 2v4"/>
                <path d="M22 4h-4"/>
                <circle cx="4" cy="20" r="2"/>
              </svg>
            </td>
            <td style="padding-left:8px;font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;vertical-align:middle;">Ozeo</td>
          </tr>
        </table>
        <h1 style="font-size:20px;margin:0 0 12px;">Bienvenue${firstName ? ` ${firstName}` : ""} 👋</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
          Ton compte est prêt. Ozeo t'aide à comprendre où part ton argent : dépenses, budgets,
          objectifs d'épargne et insights automatiques, le tout en quelques secondes par jour.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;">
          <tr>
            <td style="padding:0 0 12px;font-size:14px;line-height:1.5;">
              ⚡ <b>Ajout ultra-rapide</b> — enregistre une dépense plus vite qu'en ouvrant ton appli bancaire.
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 12px;font-size:14px;line-height:1.5;">
              � <b>Budgets qui parlent</b> — sache à l'avance si tu vas dépasser, pas juste un total en fin de mois.
            </td>
          </tr>
          <tr>
            <td style="padding:0;font-size:14px;line-height:1.5;">
              🎯 <b>Objectifs d'épargne</b> — visualise ta progression mois après mois.
            </td>
          </tr>
        </table>
        <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Ajouter ma première dépense →
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
