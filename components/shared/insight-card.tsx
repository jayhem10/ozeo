import { AlertTriangle, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/insights/engine";

const ICONS = { warning: AlertTriangle, positive: Sparkles, info: Info };
const STYLES = {
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  positive: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  info: "border-primary/20 bg-primary/5 text-primary",
};

export function InsightCard({ insight }: { insight: Insight }) {
  const Icon = ICONS[insight.importance];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3", STYLES[insight.importance])}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="text-xs text-muted-foreground">{insight.description}</p>
      </div>
    </div>
  );
}
