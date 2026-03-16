"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

interface DashboardCardsProps {
  summary: DashboardSummary | null;
  loading?: boolean;
}

export function DashboardCards({ summary, loading }: DashboardCardsProps) {
  const cards = [
    {
      title: "Saldo Total",
      value: summary?.totalBalance ?? 0,
      icon: Wallet,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      change: summary?.balanceChange,
      prefix: "hoje",
    },
    {
      title: "Gastos do Mês",
      value: summary?.monthlyExpenses ?? 0,
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      change: null,
      prefix: "este mês",
    },
    {
      title: "Economia",
      value: summary?.monthlySavings ?? 0,
      icon: PiggyBank,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      change: null,
      prefix: "este mês",
    },
    {
      title: "Orçamento Usado",
      value: summary?.budgetUsagePercent ?? 0,
      icon: Target,
      color:
        (summary?.budgetUsagePercent ?? 0) > 80
          ? "text-rose-400"
          : (summary?.budgetUsagePercent ?? 0) > 60
          ? "text-yellow-400"
          : "text-emerald-400",
      bg:
        (summary?.budgetUsagePercent ?? 0) > 80
          ? "bg-rose-500/10"
          : (summary?.budgetUsagePercent ?? 0) > 60
          ? "bg-yellow-500/10"
          : "bg-emerald-500/10",
      border:
        (summary?.budgetUsagePercent ?? 0) > 80
          ? "border-rose-500/20"
          : "border-emerald-500/20",
      isPercent: true,
      change: null,
      prefix: "do limite",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.07 }}
        >
          <Card className={`border ${card.border} hover:border-opacity-40 transition-all duration-300 hover:shadow-lg group`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg} transition-transform duration-200 group-hover:scale-110`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>

              <div className="space-y-1">
                <p className={`text-2xl font-bold tracking-tight ${card.color}`}>
                  {card.isPercent
                    ? `${card.value.toFixed(0)}%`
                    : formatCurrency(card.value)}
                </p>

                {card.change !== null && card.change !== undefined ? (
                  <div className="flex items-center gap-1">
                    {card.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-rose-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        card.change >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(Math.abs(card.change))} {card.prefix}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{card.prefix}</p>
                )}
              </div>

              {/* Progress bar for budget */}
              {card.isPercent && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(card.value, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.07, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      card.value > 80 ? "bg-rose-500" : card.value > 60 ? "bg-yellow-500" : "bg-emerald-500"
                    }`}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
