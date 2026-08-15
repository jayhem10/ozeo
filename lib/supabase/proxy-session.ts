import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export interface OptimisticSession {
  response: NextResponse;
  isAuthenticated: boolean;
}

/**
 * Refreshes the Supabase session cookies and performs a lightweight,
 * "optimistic" auth check suitable for Proxy.
 *
 * Uses `getClaims()` instead of `getUser()`: with the project's asymmetric
 * JWT signing keys it verifies the token locally via the cached JWKS
 * (no network round trip per request), only falling back to a network call
 * for legacy symmetric-secret projects. This still validates the JWT
 * signature (unlike `getSession()`), it's just not a full authorization
 * check — Next.js explicitly warns against doing slow/complete auth in
 * Proxy. Real authorization stays downstream via RLS + `getUser()` in
 * Server Components and Server Actions.
 */
export async function getOptimisticSession(request: NextRequest): Promise<OptimisticSession> {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();

  return { response, isAuthenticated: !!data?.claims };
}
