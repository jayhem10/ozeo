import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

function resolveIcon(name: string): Icons.LucideIcon {
  const icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  return icon ?? Icons.Tag;
}

export function CategoryBadge({
  category,
  className,
}: {
  category: Pick<Category, "name" | "icon" | "color"> | null;
  className?: string;
}) {
  const name = category?.name ?? "Sans catégorie";
  const Icon = resolveIcon(category?.icon ?? "Tag");
  const color = category?.color ?? "#6b7280";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <Icon className="size-3.5" />
      {name}
    </span>
  );
}
