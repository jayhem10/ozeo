import { NextResponse, type NextRequest } from "next/server";
import { getOptimisticSession } from "@/lib/supabase/proxy-session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/calendar",
  "/recurring",
  "/goals",
  "/analytics",
  "/accounts",
  "/import",
  "/settings",
  "/onboarding",
];
const AUTH_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  return updateSession(request);
}

async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { response, isAuthenticated } = await getOptimisticSession(request);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks|manifest.json).*)"],
};
