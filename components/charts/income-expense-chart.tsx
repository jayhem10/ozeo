"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { fromCents } from "@/lib/money";

export interface IncomeExpensePoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
}

export function IncomeExpenseChart({ data }: { data: IncomeExpensePoint[] }) {
  const chartData = data.map((d) => ({
    month: d.month,
    Revenus: fromCents(d.incomeCents),
    Dépenses: fromCents(d.expenseCents),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
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
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Revenus" fill="#22c55e" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Dépenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
