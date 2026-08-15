"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { MOBILE_MORE_ITEMS, MOBILE_NAV_ITEMS } from "@/components/layout/nav-items";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { signOut } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function MobileNav({ onAddClick, profile }: { onAddClick: () => void; profile: Profile | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const mid = Math.floor(MOBILE_NAV_ITEMS.length / 2);
  const isMoreActive = MOBILE_MORE_ITEMS.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden">
        <div className="relative mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {MOBILE_NAV_ITEMS.map((item, i) => {
            const isMore = item.href === "__more__";
            const isActive = isMore ? isMoreActive : pathname.startsWith(item.href);
            return (
              <div key={item.href} className="flex flex-1 justify-center">
                {i === mid && <div className="w-14" />}
                {isMore ? (
                  <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
          <button
            onClick={onAddClick}
            aria-label="Ajouter une transaction"
            className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-1 px-4 pb-2">
            {MOBILE_MORE_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t px-4 py-3 pb-6">
            <span className="truncate text-sm text-muted-foreground">
              {profile?.full_name || profile?.email}
            </span>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Se déconnecter"
                  title="Se déconnecter"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

