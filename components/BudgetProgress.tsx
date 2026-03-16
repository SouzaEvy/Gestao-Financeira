"use client";

import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getCategoryInfo } from "@/lib/utils";
import type { Budget, Transaction } from "@/types";

interface BudgetProgressProps {
  budgets: Budget[];
  transactions: Transaction[];
  loading?: boolean;
  onEdit?: (budget: Budget) => void;
}

export function BudgetProgress({ budgets, transactions, loading, onEdit }: BudgetProgressProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </Card>
        ))}
      </div>
    );
  }

  // Calculate spending per category from transactions this month
  const spendingByCategory: Record<string, number> = {};
  transactions.forEach((tx) => {
    if (tx.type === "debit" && tx.category) {
      spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + Math.abs(tx.amount);
    }
  });

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">🎯</span>
        <p className="text-sm text-muted-foreground">Nenhum orçamento definido ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em "Novo Orçamento" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map((budget, i) => {
        const spent = spendingByCategory[budget.category] || 0;
        const percent = Math.min((spent / budget.monthly_limit) * 100, 100);
        const isOver = spent > budget.monthly_limit;
        const cat = getCategoryInfo(budget.category);

        return (
          <motion.div
            key={budget.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <Card className="border-border hover:border-opacity-50 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-sm font-medium">{budget.category_pt}</span>
                    {isOver && (
                      <span className="text-xs text-rose-400 font-medium">Limite excedido!</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums">
                      <span className={isOver ? "text-rose-400 font-semibold" : "text-foreground"}>
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-muted-foreground"> / {formatCurrency(budget.monthly_limit)}</span>
                    </span>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onEdit(budget)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <Progress
                  value={percent}
                  className="h-2"
                  indicatorClassName={
                    isOver
                      ? "bg-rose-500"
                      : percent > 75
                      ? "bg-yellow-500"
                      : "bg-emerald-500"
                  }
                />

                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">{percent.toFixed(0)}% usado</span>
                  <span className="text-xs text-muted-foreground">
                    {isOver
                      ? `${formatCurrency(spent - budget.monthly_limit)} acima do limite`
                      : `${formatCurrency(budget.monthly_limit - spent)} restantes`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
