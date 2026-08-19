"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SELECTED_ACCOUNT_COOKIE, ALL_ACCOUNTS_VALUE } from "@/lib/data/account-filter";

export async function setSelectedAccount(accountId: string | null) {
  const store = await cookies();
  store.set(SELECTED_ACCOUNT_COOKIE, accountId ?? ALL_ACCOUNTS_VALUE, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  // "layout" also refreshes the (app) layout that renders the header's account switcher.
  revalidatePath("/dashboard", "layout");
}
