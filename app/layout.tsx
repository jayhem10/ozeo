import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ozeo — Comprends où va ton argent",
    template: "%s · Ozeo",
  },
  description:
    "L'OS personnel de tes finances : dépenses, budgets, objectifs d'épargne et insights automatiques.",
  applicationName: "Ozeo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ozeo",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  // Makes iOS/Android actually shrink the layout viewport when the keyboard opens
  // instead of just overlaying it — fixes dvh-based drawers jumping/hiding behind the keyboard.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {process.env.NODE_ENV === "development" && (
          // Dev-only guard for a known Next.js 16 Turbopack bug (vercel/next.js#86060):
          // React's Component Performance Track calls performance.measure() with a
          // negative timestamp, which crashes the dev overlay and triggers reload loops.
          <Script id="patch-performance-measure" strategy="beforeInteractive">
            {`
              (function () {
                try {
                  var perf = window.performance;
                  if (!perf || typeof perf.measure !== "function" || perf.__ozeoPatched) return;
                  var original = perf.measure.bind(perf);
                  perf.measure = function () {
                    try {
                      return original.apply(perf, arguments);
                    } catch (err) {
                      var msg = (err && err.message) || "";
                      if (msg.indexOf("negative time stamp") !== -1 || msg.indexOf("cannot be negative") !== -1) return;
                      throw err;
                    }
                  };
                  perf.__ozeoPatched = true;
                } catch (_) {}
              })();
            `}
          </Script>
        )}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delay={200}>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

