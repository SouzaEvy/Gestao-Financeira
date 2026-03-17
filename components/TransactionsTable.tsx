"use client";

import { useState } from "react";
import { EyeOff, Eye, MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency, getCategoryInfo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import type { Transaction } from "@/types";
import { resolvedType, resolvedCategory } from "@/types";

interface TransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  title?: string;
  maxRows?: number;
  scrollable?: boolean;
  showIgnored?: boolean;
  onIgnoreChange?: (id: string, ignored: boolean) => void;
  onTransactionUpdate?: (id: string, updates: Partial<Transaction>) => void;
  onDelete?: (id: string) => void;
}

export function TransactionsTable({
  transactions,
  loading,
  title = "Transações Recentes",
  maxRows = 10,
  scrollable = false,
  showIgnored = false,
  onIgnoreChange,
  onTransactionUpdate,
  onDelete,
}: TransactionsTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const rows = transactions
    .filter((t) => showIgnored || !t.ignored)
    .slice(0, maxRows);

  const ignoredCount = transactions.filter((t) => t.ignored).length;

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Transação excluída.");
      onDelete?.(id);
    } catch {
      toast.error("Erro ao excluir transação.");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

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
              {ignoredCount} ignorada{ignoredCount > 1 ? "s" : ""}.
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((tx) => {
            // Use resolved type and category (respects user overrides)
            const txType = resolvedType(tx);
            const txCategory = resolvedCategory(tx);
            const cat = getCategoryInfo(txCategory);
            const isCredit = txType === "credit";
            const hasOverride = tx.custom_type || tx.custom_category;

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-6 py-3.5 hover:bg-accent/30 transition-colors ${tx.ignored ? "opacity-50 bg-muted/20" : ""}`}
              >
                {/* Category icon */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ background: `${cat.color}18` }}
                >
                  {cat.emoji}
                </div>

                {/* Description + metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium truncate ${tx.ignored ? "line-through" : ""}`}>
                      {tx.description}
                    </p>
                    {tx.ignored && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted text-muted-foreground shrink-0">
                        ignorado
                      </Badge>
                    )}
                    {hasOverride && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-sky-500/40 text-sky-400 shrink-0">
                        editado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border">
                      {cat.pt}
                    </Badge>
                    {tx.is_credit_card && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-sky-500/40 bg-sky-500/10 text-sky-400 gap-1 shrink-0">
                        💳 Cartão
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Amount — uses resolved type */}
                <span className={`text-sm font-semibold tabular-nums ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCredit ? "+" : "-"}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>

                {/* Actions */}
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
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() => setEditingTx(tx)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar categoria / tipo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleIgnore(tx)}
                      className={`gap-2 ${tx.ignored ? "text-emerald-400" : "text-muted-foreground"}`}
                    >
                      {tx.ignored ? (
                        <><Eye className="h-4 w-4" /> Restaurar transação</>
                      ) : (
                        <><EyeOff className="h-4 w-4" /> Ignorar transação</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirmDeleteId(tx.id)}
                      className="gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" /> Excluir transação
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <>
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

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Excluir transação?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-5 bg-muted/50 rounded-lg p-3">
              💡 Dica: se a transação foi importada do banco, ela pode voltar na próxima sincronização. 
              Use <strong className="text-foreground">"Ignorar"</strong> para ocultá-la permanentemente sem excluir.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deleting && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Excluir permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <EditTransactionDialog
        transaction={editingTx}
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        onSave={(id, updates) => {
          onTransactionUpdate?.(id, updates);
          setEditingTx(null);
        }}
      />
    </>
  );
}
