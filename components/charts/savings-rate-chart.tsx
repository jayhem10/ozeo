"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface SavingsRatePoint {
  month: string;
  ratio: number; // 0..1 (can be negative)
}

export function SavingsRateChart({ data }: { data: SavingsRatePoint[] }) {
  const chartData = data.map((d) => ({ month: d.month, rate: Math.round(d.ratio * 100) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
        <YAxis hide />
        <Tooltip
          formatter={(value) => `${value} %`}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
