import * as Icons from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MoneyDisplay } from "@/components/shared/money-display";
import { computeGoalProjection } from "@/lib/calculations/budget";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { SavingsGoal } from "@/types/database";

function resolveIcon(name: string): Icons.LucideIcon {
  return (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Target;
}

export function GoalCard({ goal, children }: { goal: SavingsGoal; children?: React.ReactNode }) {
  const Icon = resolveIcon(goal.icon);
  const projection = computeGoalProjection(
    goal.target_amount_cents,
    goal.current_amount_cents,
    goal.monthly_contribution_cents
  );

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div
          className="flex size-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${goal.color}1a`, color: goal.color }}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="font-medium">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            <MoneyDisplay cents={goal.current_amount_cents} size="sm" /> /{" "}
            <MoneyDisplay cents={goal.target_amount_cents} size="sm" />
          </p>
        </div>
      </div>

      <Progress value={projection.progressRatio * 100} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{Math.round(projection.progressRatio * 100)} %</span>
        <span>
          {projection.isReached
            ? "Objectif atteint 🎉"
            : projection.estimatedCompletionDate
              ? `Estimé : ${format(projection.estimatedCompletionDate, "MMM yyyy", { locale: fr })}`
              : "Ajoute une contribution mensuelle"}
        </span>
      </div>

      {children}
    </div>
  );
}
