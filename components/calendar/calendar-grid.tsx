"use client";

import { useState } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoneyDisplay } from "@/components/shared/money-display";
import { cn } from "@/lib/utils";
import type { Account, Category, RecurringTransaction, Transaction } from "@/types/database";

export interface CalendarDayData {
  date: Date;
  transactions: (Transaction & { category: Category | null; account: Account })[];
  recurring: (RecurringTransaction & { category: Category | null; account: Account })[];
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarGrid({
  days,
  monthLabel,
  prevHref,
  nextHref,
}: {
  days: CalendarDayData[];
  monthLabel: string;
  prevHref: string;
  nextHref: string;
}) {
  const [selected, setSelected] = useState<CalendarDayData | null>(null);
  const referenceMonth = days[Math.floor(days.length / 2)]?.date ?? new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  render={<Link href={prevHref} aria-label="Mois précédent" />}
                  nativeButton={false}
                  variant="outline"
                  size="icon"
                />
              }
            >
              <ChevronLeft className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Mois précédent</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  render={<Link href={nextHref} aria-label="Mois suivant" />}
                  nativeButton={false}
                  variant="outline"
                  size="icon"
                />
              }
            >
              <ChevronRight className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Mois suivant</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const hasItems = day.transactions.length > 0 || day.recurring.length > 0;
          const netCents = day.transactions.reduce(
            (sum, t) => sum + (t.type === "expense" ? -t.amount_cents : t.amount_cents),
            0
          );
          return (
            <button
              key={day.date.toISOString()}
              onClick={() => hasItems && setSelected(day)}
              disabled={!hasItems}
              className={cn(
                "flex aspect-square flex-col items-start gap-1 rounded-lg border p-1.5 text-left text-xs transition-colors",
                !isSameMonth(day.date, referenceMonth) && "opacity-40",
                isToday(day.date) && "border-primary",
                hasItems ? "hover:bg-muted cursor-pointer" : "cursor-default"
              )}
            >
              <span className="font-medium">{format(day.date, "d")}</span>
              {day.transactions.length > 0 && (
                <MoneyDisplay cents={netCents} signed size="sm" className="text-[10px]" />
              )}
              {day.recurring.length > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  {day.recurring.length} à venir
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selected && format(selected.date, "EEEE d MMMM yyyy", { locale: fr })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selected?.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{t.merchant || t.description || "Transaction"}</span>
                <MoneyDisplay cents={t.type === "expense" ? -t.amount_cents : t.amount_cents} signed size="sm" />
              </div>
            ))}
            {selected?.recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="truncate">{r.name} (à venir)</span>
                <MoneyDisplay cents={r.type === "expense" ? -r.amount_cents : r.amount_cents} signed size="sm" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
