"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { fetchData } from "@/lib/api";
import { formatCurrency, getCategoryInfo, startOfCurrentMonth, endOfCurrentMonth } from "@/lib/utils";
import type { Budget, Transaction } from "@/types";

const CATEGORY_OPTIONS = [
  "Food", "Transport", "Health", "Entertainment",
  "Shopping", "Education", "Housing", "Utilities",
  "Streaming", "Investment", "Other",
];

const BUDGET_COLORS = [
  "#0ea5e9", "#10b981", "#f97316", "#a855f7",
  "#ec4899", "#f59e0b", "#3b82f6", "#84cc16",
];

const budgetSchema = z.object({
  category: z.string().min(1, "Selecione uma categoria"),
  monthly_limit: z.number({ invalid_type_error: "Digite um valor" }).positive("Deve ser maior que zero"),
  color: z.string().min(1),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const { user } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userId = user?.id;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { color: BUDGET_COLORS[0] },
  });

  const selectedColor = watch("color");
  const selectedCategory = watch("category");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        fetchData<Budget>("budgets"),
        fetchData<Transaction>("transactions", {
          from: startOfCurrentMonth(),
          to: endOfCurrentMonth(),
        }),
      ]);
      setBudgets(b);
      setTransactions(t);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openNew = () => {
    setEditingBudget(null);
    reset({ color: BUDGET_COLORS[budgets.length % BUDGET_COLORS.length] });
    setDialogOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget);
    reset({ category: budget.category, monthly_limit: budget.monthly_limit, color: budget.color });
    setDialogOpen(true);
  };

  const onSubmit = async (values: BudgetFormValues) => {
    if (!userId) return;
    setSaving(true);
    const catInfo = getCategoryInfo(values.category);

    try {
      const method = editingBudget ? "PUT" : "POST";
      const body = editingBudget
        ? { id: editingBudget.id, ...values, category_pt: catInfo.pt }
        : { ...values, category_pt: catInfo.pt };

      const res = await fetch("/api/budgets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar");

      toast.success(editingBudget ? "Orçamento atualizado!" : "Orçamento criado!");
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar orçamento.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBudget = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/budgets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Orçamento removido.");
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Erro ao remover orçamento.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const totalSpent = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const overallPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const usedCategories = budgets.map((b) => b.category);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        <div className="flex items-center justify-between">
          <div />
          <Button onClick={openNew} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
            <Plus className="h-4 w-4" /> Novo Orçamento
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Orçamento Total", val: formatCurrency(totalBudget), color: "text-sky-400", border: "border-sky-500/20" },
            { label: "Total Gasto", val: formatCurrency(totalSpent), color: overallPercent > 100 ? "text-rose-400" : "text-foreground", border: overallPercent > 100 ? "border-rose-500/20" : "border-border" },
            { label: "Restante", val: formatCurrency(Math.max(totalBudget - totalSpent, 0)), color: "text-emerald-400", border: "border-emerald-500/20" },
          ].map((s) => (
            <Card key={s.label} className={`border ${s.border}`}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                {s.label === "Orçamento Total" && totalBudget > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(overallPercent, 100)}%`, background: overallPercent > 100 ? "#f43f5e" : overallPercent > 75 ? "#f59e0b" : "#10b981" }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{overallPercent.toFixed(0)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Categorias ({budgets.length})</h3>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />)}</div>
          ) : budgets.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">🎯</span>
                <p className="font-semibold mb-1">Sem orçamentos ainda</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">Defina limites mensais por categoria para controlar seus gastos.</p>
                <Button onClick={openNew} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white"><Plus className="h-4 w-4" /> Criar primeiro orçamento</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => {
                const spent = transactions.filter((t) => t.type === "debit" && t.category === budget.category).reduce((s, t) => s + Math.abs(t.amount), 0);
                const percent = Math.min((spent / budget.monthly_limit) * 100, 100);
                const isOver = spent > budget.monthly_limit;
                const cat = getCategoryInfo(budget.category);

                return (
                  <Card key={budget.id} className="border-border group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg text-base" style={{ background: `${budget.color}20` }}>{cat.emoji}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{budget.category_pt}</span>
                              {isOver && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Excedido</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(spent)} de {formatCurrency(budget.monthly_limit)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => openEdit(budget)}>Editar</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-400" onClick={() => deleteBudget(budget.id)} disabled={deletingId === budget.id}>
                            {deletingId === budget.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: isOver ? "#f43f5e" : percent > 75 ? "#f59e0b" : budget.color }} />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">{percent.toFixed(0)}% usado</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{isOver ? `${formatCurrency(spent - budget.monthly_limit)} acima` : `${formatCurrency(budget.monthly_limit - spent)} restantes`}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
            <DialogDescription>Defina um limite mensal de gastos para esta categoria.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={(v) => setValue("category", v)} disabled={!!editingBudget}>
                <SelectTrigger className={errors.category ? "border-rose-500" : ""}><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.filter((c) => editingBudget || !usedCategories.includes(c)).map((c) => {
                    const info = getCategoryInfo(c);
                    return <SelectItem key={c} value={c}>{info.emoji} {info.pt}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-rose-400">{errors.category.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Limite Mensal (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input type="number" step="0.01" min="1" placeholder="0,00" className={`pl-9 ${errors.monthly_limit ? "border-rose-500" : ""}`} {...register("monthly_limit", { valueAsNumber: true })} />
              </div>
              {errors.monthly_limit && <p className="text-xs text-rose-400">{errors.monthly_limit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {BUDGET_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setValue("color", c)} className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110" style={{ background: c, borderColor: selectedColor === c ? "white" : "transparent" }} />
                ))}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-sky-500 hover:bg-sky-600 text-white gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingBudget ? "Salvar alterações" : "Criar orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
