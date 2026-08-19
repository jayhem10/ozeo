import { cookies } from "next/headers";

export const SELECTED_ACCOUNT_COOKIE = "selected_account_id";
// Cookie value meaning "the user explicitly picked All accounts",
// distinct from "no cookie yet" (which falls back to the profile default).
export const ALL_ACCOUNTS_VALUE = "all";

export async function getSelectedAccountId(defaultAccountId?: string | null): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SELECTED_ACCOUNT_COOKIE)?.value;
  if (raw === ALL_ACCOUNTS_VALUE) return null;
  if (raw) return raw;
  return defaultAccountId ?? null;
}

// A cookie or profile default can point to an account that was since deleted —
// fall back to "All accounts" instead of silently filtering everything to nothing.
export function resolveSelectedAccountId(
  rawId: string | null,
  accounts: { id: string }[]
): string | null {
  return rawId && accounts.some((a) => a.id === rawId) ? rawId : null;
}
