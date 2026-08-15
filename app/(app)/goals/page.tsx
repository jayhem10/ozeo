import { Target } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSavingsGoals } from "@/lib/data/goals";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { GoalActions } from "@/components/goals/goal-actions";

export default async function GoalsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const goals = await getSavingsGoals(supabase, user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Objectifs d'épargne"
        description="Fixe un cap et suis ta progression mois après mois."
        action={<GoalFormDialog />}
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aucun objectif"
          description="Crée un objectif — voyage, fonds d'urgence, achat — et suis ta progression."
          action={<GoalFormDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal}>
              <div className="flex items-center justify-between gap-2 pt-1">
                <GoalFormDialog goal={goal} />
                <GoalActions goalId={goal.id} goalName={goal.name} />
              </div>
            </GoalCard>
          ))}
        </div>
      )}
    </div>
  );
}
