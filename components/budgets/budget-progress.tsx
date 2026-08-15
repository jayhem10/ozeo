import { Progress } from "@/components/ui/progress";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { cn } from "@/lib/utils";
import type { BudgetPace } from "@/lib/calculations/budget";
import type { Category } from "@/types/database";

const PACE_LABEL: Record<BudgetPace, string> = {
  no_budget: "Pas de budget",
  normal: "Rythme normal",
  attention: "À surveiller",
  at_risk: "Risque de dépassement",
  over: "Dépassé",
};

const PACE_COLOR: Record<BudgetPace, string> = {
  no_budget: "text-muted-foreground",
  normal: "text-emerald-600 dark:text-emerald-400",
  attention: "text-amber-600 dark:text-amber-400",
  at_risk: "text-orange-600 dark:text-orange-400",
  over: "text-red-600 dark:text-red-400",
};

export function BudgetProgress({
  category,
  spentCents,
  budgetCents,
  progressRatio,
  pace,
}: {
  category: Category;
  spentCents: number;
  budgetCents: number;
  progressRatio: number;
  pace: BudgetPace;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <CategoryBadge category={category} />
        <span className="text-sm text-muted-foreground">
          <MoneyDisplay cents={spentCents} size="sm" /> / <MoneyDisplay cents={budgetCents} size="sm" />
        </span>
      </div>
      <Progress
        value={Math.min(100, progressRatio * 100)}
        className={cn(
          "h-2",
          pace === "over" && "[&>div]:bg-red-500",
          pace === "at_risk" && "[&>div]:bg-orange-500",
          pace === "attention" && "[&>div]:bg-amber-500"
        )}
      />
      <p className={cn("text-xs font-medium", PACE_COLOR[pace])}>
        {Math.round(progressRatio * 100)} % · {PACE_LABEL[pace]}
      </p>
    </div>
  );
}
