"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/schemas";
import { completeOnboarding } from "@/lib/actions/profile";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];
const STEPS = ["welcome", "currency", "account", "budget", "done"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const step: Step = STEPS[stepIndex];

  const { register, handleSubmit, watch, setValue } = useForm<
    z.input<typeof onboardingSchema>,
    unknown,
    OnboardingValues
  >({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { currency: "EUR", account_name: "Compte courant", monthly_budget: undefined },
  });

  function next() {
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  async function finish(values: OnboardingValues) {
    setSubmitting(true);
    const result = await completeOnboarding(values);
    setSubmitting(false);
    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i <= stepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        {step === "welcome" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-300 to-violet-500 text-white">
              <Sparkles className="size-6" />
            </div>
            <h2 className="text-xl font-semibold">Bienvenue 👋</h2>
            <p className="text-sm text-muted-foreground">
              En 3 étapes, ton espace est prêt à suivre tes finances au quotidien.
            </p>
            <Button onClick={next} className="w-full">
              Commencer
            </Button>
          </div>
        )}

        {step === "currency" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Quelle est ta devise ?</h2>
            <Select value={watch("currency")} onValueChange={(v) => v && setValue("currency", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={next} className="w-full">
              Continuer
            </Button>
          </div>
        )}

        {step === "account" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Créons ton premier compte</h2>
            <div className="space-y-1.5">
              <Label htmlFor="account_name">Nom du compte</Label>
              <Input id="account_name" {...register("account_name")} />
            </div>
            <Button onClick={next} className="w-full">
              Continuer
            </Button>
          </div>
        )}

        {step === "budget" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Quel est ton budget mensuel ?</h2>
            <p className="text-sm text-muted-foreground">Tu pourras l&apos;ajuster à tout moment.</p>
            <div className="space-y-1.5">
              <Label htmlFor="monthly_budget">Budget mensuel (optionnel)</Label>
              <Input id="monthly_budget" type="number" step="0.01" placeholder="2000" {...register("monthly_budget")} />
            </div>
            <Button onClick={next} className="w-full">
              Continuer
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <PartyPopper className="mx-auto size-10 text-primary" />
            <h2 className="text-lg font-semibold">Tout est prêt.</h2>
            <p className="text-sm text-muted-foreground">Ton tableau de bord t&apos;attend.</p>
            <Button onClick={handleSubmit(finish)} disabled={submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Accéder au dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
