"use client";

import { useState } from "react";
import { EyeOff, Eye, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency, getCategoryInfo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transaction } from "@/types";

interface TransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  title?: string;
  maxRows?: number;
  scrollable?: boolean;
  showIgnored?: boolean;
  onIgnoreChange?: (id: string, ignored: boolean) => void;
}

export function TransactionsTable({
  transactions,
  loading,
  title = "Transações Recentes",
  maxRows = 10,
  scrollable = false,
  showIgnored = false,
  onIgnoreChange,
}: TransactionsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const rows = transactions
    .filter((t) => showIgnored || !t.ignored)
    .slice(0, maxRows);

  const ignoredCount = transactions.filter((t) => t.ignored).length;

  const handleIgnore = async (tx: Transaction) => {
    setLoadingId(tx.id);
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tx.id, ignored: !tx.ignored }),
      });
      if (!res.ok) throw new Error();
      toast.success(tx.ignored ? "Transação restaurada." : "Transação ignorada.");
      onIgnoreChange?.(tx.id, !tx.ignored);
    } catch {
      toast.error("Erro ao atualizar transação.");
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-40 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const listContent = (
    <>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-3xl mb-3">💳</span>
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
          {ignoredCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {ignoredCount} transação{ignoredCount > 1 ? "ões" : ""} ignorada{ignoredCount > 1 ? "s" : ""}.
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((tx) => {
            const cat = getCategoryInfo(tx.category);
            const isCredit = tx.type === "credit";

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-6 py-3.5 hover:bg-accent/30 transition-colors ${tx.ignored ? "opacity-50 bg-muted/20" : ""}`}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ background: `${cat.color}18` }}
                >
                  {cat.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${tx.ignored ? "line-through" : ""}`}>
                      {tx.description}
                    </p>
                    {tx.ignored && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted text-muted-foreground shrink-0">
                        ignorado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border">
                      {cat.pt}
                    </Badge>
                  </div>
                </div>

                <span className={`text-sm font-semibold tabular-nums ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCredit ? "+" : "-"}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>

                {/* Actions dropdown */}
                {onIgnoreChange && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                        disabled={loadingId === tx.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleIgnore(tx)} className="gap-2">
                        {tx.ignored ? (
                          <><Eye className="h-4 w-4" /> Restaurar transação</>
                        ) : (
                          <><EyeOff className="h-4 w-4" /> Ignorar transação</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rows.length} transaç{rows.length !== 1 ? "ões" : "ão"}
              {ignoredCount > 0 && !showIgnored && ` · ${ignoredCount} ignorada${ignoredCount > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {scrollable ? (
          <ScrollArea className="max-h-[400px]">{listContent}</ScrollArea>
        ) : (
          <div>{listContent}</div>
        )}
      </CardContent>
    </Card>
  );
}
