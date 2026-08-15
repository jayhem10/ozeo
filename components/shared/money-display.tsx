import { cn } from "@/lib/utils";
import { formatMoney, formatSignedMoney } from "@/lib/money";

export function MoneyDisplay({
  cents,
  currency = "EUR",
  signed = false,
  className,
  size = "md",
}: {
  cents: number;
  currency?: string;
  signed?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl font-semibold",
    xl: "text-4xl font-bold tracking-tight",
  };

  const positive = cents >= 0;
  const text = signed ? formatSignedMoney(cents, currency) : formatMoney(cents, currency);

  return (
    <span
      className={cn(
        sizes[size],
        signed && (positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"),
        className
      )}
    >
      {text}
    </span>
  );
}
