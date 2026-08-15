"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fromCents } from "@/lib/money";

export interface TrendPoint {
  date: string; // label, e.g. "12 août"
  cents: number;
}

export function SpendingTrendChart({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((d) => ({ date: d.date, amount: fromCents(d.cents) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          minTickGap={24}
          stroke="var(--muted-foreground)"
        />
        <YAxis hide />
        <Tooltip
          formatter={(value) => `${Number(value).toFixed(2)} €`}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#spendingGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
