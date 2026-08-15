"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
      <path d="M16.36 1.43c0 1.14-.42 2.06-1.26 2.86-.85.78-1.84 1.18-2.96 1.1-.06-1.09.37-2.05 1.2-2.86.83-.79 1.9-1.24 3.02-1.1zM20.5 17.36c-.42.98-.62 1.41-1.16 2.28-.76 1.21-1.83 2.72-3.15 2.73-1.17.02-1.47-.77-3.06-.76-1.58 0-1.92.75-3.09.77-1.32.02-2.33-1.36-3.09-2.57-2.12-3.35-2.34-7.28-1.03-9.37.93-1.48 2.4-2.35 3.79-2.35 1.41 0 2.3.78 3.47.78 1.13 0 1.83-.78 3.46-.78 1.24 0 2.56.68 3.5 1.85-3.08 1.69-2.58 6.09.36 7.2z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.41-5.26 5.7.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.21.66.8.55A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

const PROVIDER_META: Record<
  Extract<Provider, "google" | "apple" | "github">,
  { label: string; icon: React.ComponentType }
> = {
  google: { label: "Continuer avec Google", icon: GoogleIcon },
  apple: { label: "Continuer avec Apple", icon: AppleIcon },
  github: { label: "Continuer avec GitHub", icon: GithubIcon },
};

export function OAuthSignInButton({
  provider,
  next,
}: {
  provider: "google" | "apple" | "github";
  next: string;
}) {
  const [loading, setLoading] = useState(false);
  const { label, icon: Icon } = PROVIDER_META[provider];

  async function handleSignIn() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) setLoading(false);
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      size="lg"
      variant={provider === "apple" ? "secondary" : "default"}
      className="w-full gap-2"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon />}
      {label}
    </Button>
  );
}
