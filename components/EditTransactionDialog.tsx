"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCategoryInfo, formatCurrency, formatDate } from "@/lib/utils";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import type { Transaction, CustomCategory } from "@/types";
import { resolvedType, resolvedCategory } from "@/types";

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => void;
}

const EMOJI_OPTIONS = ["🍔","🚗","💊","🎬","🛍️","📚","🏠","💡","💰","↔️","📈","⚡","⚙️","📦","🎯","✈️","🐾","🎁","💇","🏋️"];
const COLOR_OPTIONS = ["#0ea5e9","#10b981","#f97316","#a855f7","#ec4899","#f59e0b","#3b82f6","#84cc16","#f43f5e","#06b6d4","#8b5cf6","#6b7280"];

export function EditTransactionDialog({ transaction, open, onClose, onSave }: EditTransactionDialogProps) {
  const [saving, setSaving] = useState(false);
  const [customType, setCustomType] = useState<string>("original");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // New category form
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [newCatColor, setNewCatColor] = useState("#0ea5e9");
  const [savingCat, setSavingCat] = useState(false);

  // Load custom categories
  useEffect(() => {
    if (!open) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then(({ data }) => setCustomCategories(data ?? []))
      .catch(console.error);
  }, [open]);

  // Populate form when transaction changes
  useEffect(() => {
    if (!transaction) return;
    setCustomType(transaction.custom_type ?? "original");
    setSelectedCategory(transaction.custom_category ?? transaction.category ?? "");
    setShowNewCat(false);
  }, [transaction]);

  if (!transaction) return null;

  const origType = resolvedType(transaction);
  const origCat = resolvedCategory(transaction);
  const catInfo = getCategoryInfo(origCat);

  const handleSave = async () => {
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        custom_type: customType === "original" ? null : customType,
        custom_category: selectedCategory !== transaction.category ? selectedCategory : null,
      };

      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: transaction.id, ...patch }),
      });
      if (!res.ok) throw new Error();
      toast.success("Transação atualizada!");
      onSave(transaction.id, {
        custom_type: patch.custom_type as "credit" | "debit" | null,
        custom_category: patch.custom_category as string | null,
      });
      onClose();
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_pt: newCatName.trim(), emoji: newCatEmoji, color: newCatColor }),
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      setCustomCategories((prev) => [...prev, data]);
      setSelectedCategory(data.name);
      setNewCatName("");
      setNewCatEmoji("📦");
      setNewCatColor("#0ea5e9");
      setShowNewCat(false);
      toast.success(`Categoria "${data.name_pt}" criada!`);
    } catch {
      toast.error("Erro ao criar categoria.");
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCustomCat = async (cat: CustomCategory) => {
    try {
      await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id }),
      });
      setCustomCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (selectedCategory === cat.name) setSelectedCategory(transaction.category ?? "");
      toast.success("Categoria removida.");
    } catch {
      toast.error("Erro ao remover categoria.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {formatDate(transaction.date)} · {formatCurrency(Math.abs(transaction.amount))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Description (read-only) */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">Descrição original</p>
            <p className="text-sm font-medium truncate">{transaction.description}</p>
          </div>

          {/* Type override */}
          <div className="space-y-2">
            <Label>Tipo de transação</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "original", label: "Original", sub: origType === "credit" ? "Receita" : "Despesa", color: "border-border" },
                { value: "credit", label: "✅ Receita", sub: "forçar como receita", color: customType === "credit" ? "border-emerald-500 bg-emerald-500/10" : "border-border" },
                { value: "debit", label: "❌ Despesa", sub: "forçar como despesa", color: customType === "debit" ? "border-rose-500 bg-rose-500/10" : "border-border" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCustomType(opt.value)}
                  className={`rounded-lg border p-3 text-left transition-all ${opt.color} ${customType === opt.value ? "ring-1 ring-offset-1 ring-sky-500" : "hover:bg-accent"}`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
            {customType !== "original" && (
              <div className="text-xs text-sky-400 flex items-center gap-1">
                ⚡ Override ativo — original era{" "}
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {transaction.type === "credit" ? "receita" : "despesa"}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Category override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Categoria</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-sky-400"
                onClick={() => setShowNewCat(!showNewCat)}
              >
                <Plus className="h-3 w-3" />
                Nova categoria
              </Button>
            </div>

            {/* New category inline form */}
            {showNewCat && (
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 space-y-3">
                <p className="text-xs font-medium text-sky-400">Criar nova categoria</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da categoria..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                  />
                </div>
                {/* Emoji picker */}
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setNewCatEmoji(e)}
                      className={`h-8 w-8 rounded-lg text-base flex items-center justify-center transition-all ${newCatEmoji === e ? "bg-sky-500/30 ring-1 ring-sky-500" : "hover:bg-accent"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                {/* Color picker */}
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: newCatColor === c ? "white" : "transparent" }}
                    />
                  ))}
                </div>
                {/* Preview */}
                {newCatName && (
                  <div className="flex items-center gap-2 text-xs">
                    <span>Preview:</span>
                    <span
                      className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-white font-medium"
                      style={{ background: newCatColor + "40", border: `1px solid ${newCatColor}60` }}
                    >
                      {newCatEmoji} {newCatName}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs bg-sky-500 hover:bg-sky-600 text-white gap-1"
                    onClick={handleCreateCategory}
                    disabled={!newCatName.trim() || savingCat}
                  >
                    {savingCat && <Loader2 className="h-3 w-3 animate-spin" />}
                    Criar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowNewCat(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Category selector with search */}
            <CategoryCombobox
              value={selectedCategory}
              onChange={setSelectedCategory}
              customCategories={customCategories}
              placeholder="Selecionar categoria"
            />

            {/* Custom categories management */}
            {customCategories.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">Gerenciar minhas categorias:</p>
                <div className="flex flex-wrap gap-1.5">
                  {customCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-1.5 rounded-full pl-2.5 pr-1 py-0.5 text-xs border"
                      style={{ borderColor: cat.color + "60", background: cat.color + "15" }}
                    >
                      <span>{cat.emoji} {cat.name_pt}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCat(cat)}
                        className="ml-0.5 rounded-full hover:bg-rose-500/20 p-0.5 text-muted-foreground hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Original category */}
            <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
              <span>Original: {catInfo.emoji} {catInfo.pt}</span>
              {transaction.custom_category && (
                <button
                  type="button"
                  className="text-sky-400 hover:underline"
                  onClick={() => setSelectedCategory(transaction.category ?? "")}
                >
                  (restaurar original)
                </button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-sky-500 hover:bg-sky-600 text-white gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
