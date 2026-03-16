"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyChartData } from "@/types";

interface BalanceChartProps {
  data: MonthlyChartData[];
  loading?: boolean;
  selectedMonth?: string | null;
  onMonthClick?: (monthKey: string) => void;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function BalanceChart({ data, loading, selectedMonth, onMonthClick }: BalanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-64 w-full rounded-lg" /></CardContent>
      </Card>
    );
  }

  const handleClick = (chartData: { activePayload?: Array<{ payload: MonthlyChartData }> }) => {
    const monthKey = chartData?.activePayload?.[0]?.payload?.monthKey;
    if (monthKey && onMonthClick) onMonthClick(monthKey);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Receitas vs. Despesas</CardTitle>
        <p className="text-xs text-muted-foreground">
          Clique em um mês para filtrar o dashboard
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              onClick={handleClick}
              style={{ cursor: onMonthClick ? "pointer" : "default" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="receitas" radius={[4, 4, 0, 0]} fillOpacity={0.9} maxBarSize={40}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill="#10b981"
                    opacity={!selectedMonth || entry.monthKey === selectedMonth ? 1 : 0.3}
                  />
                ))}
              </Bar>
              <Bar dataKey="despesas" radius={[4, 4, 0, 0]} fillOpacity={0.9} maxBarSize={40}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill="#f43f5e"
                    opacity={!selectedMonth || entry.monthKey === selectedMonth ? 1 : 0.3}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="economia"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: "#0ea5e9", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
