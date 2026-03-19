"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Search, SlidersHorizontal, X, Calendar } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Navbar } from "@/components/Navbar";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

import { fetchData } from "@/lib/api";
import { DateRangePicker, type DateRange } from "@/components/DateRangePicker";
import { formatCurrency, getCategoryInfo, getCategoriesGrouped } from "@/lib/utils";
import type { Transaction } from "@/types";
import { resolvedType } from "@/types";

// Build a list of month options from the last 12 months + "Todos"
function buildMonthOptions() {
  const options: { value: string; label: string }[] = [
    { value: "all", label: "Todos os períodos" },
  ];
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(), i);
    const value = format(d, "yyyy-MM"); // e.g. "2026-03"
    const label = format(d, "MMMM 'de' yyyy", { locale: ptBR }); // e.g. "março de 2026"
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [dateMode, setDateMode] = useState<"liquidation" | "competence">("liquidation");
  const [creditFilter, setCreditFilter] = useState("all"); // "all" | "credit_card" | "debit_account"
  const [showIgnored, setShowIgnored] = useState(false);

  const handleIgnoreChange = (id: string, ignored: boolean) => {
    setAllTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ignored } : t))
    );
  };

  const handleDelete = (id: string) => {
    setAllTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTransactionUpdate = (id: string, updates: Partial<import("@/types").Transaction>) => {
    setAllTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  // Load ALL transactions once — filter entirely client-side
  useEffect(() => {
    setLoading(true);
    fetchData<Transaction>("transactions", { noDateFilter: true })
      .then((data) => setAllTransactions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Extract date from description for competence mode
  // e.g. "DEBITO VISA ELECTRON BRASIL 28/02 LOJA" → "28/02" → month "02"
  const getCompetenceMonth = (tx: Transaction): string => {
    const match = tx.description.match(/(\d{2})\/(\d{2})/);
    if (match) {
      const month = match[2];
      // Use the year from tx.date, but month from description
      const year = tx.date.slice(0, 4);
      // If tx is in March but description says 02, competence is Feb of same year
      const txMonth = parseInt(tx.date.slice(5, 7));
      const descMonth = parseInt(month);
      // If description month is greater than tx month, it might be previous year
      const competenceYear = descMonth > txMonth + 1 ? String(parseInt(year) - 1) : year;
      return `${competenceYear}-${month.padStart(2, "0")}`;
    }
    return tx.date.slice(0, 7); // fallback to liquidation date
  };

  const filtered = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Date range filter (takes priority over month filter)
      if (dateRange) {
        if (tx.date < dateRange.from || tx.date > dateRange.to) return false;
      } else if (monthFilter !== "all") {
        const txMonth = dateMode === "competence"
          ? getCompetenceMonth(tx)
          : tx.date.slice(0, 7);
        if (txMonth !== monthFilter) return false;
      }

      // Search
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;

      // Category
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;

      // Type
      if (typeFilter !== "all" && resolvedType(tx) !== typeFilter) return false;

      // Credit card filter
      if (creditFilter === "credit_card" && !tx.is_credit_card) return false;
      if (creditFilter === "debit_account" && tx.is_credit_card) return false;

      return true;
    });
  }, [allTransactions, search, categoryFilter, typeFilter, monthFilter, creditFilter, dateMode, dateRange]);

  const totals = useMemo(() => {
    const credits = filtered.filter((t) => resolvedType(t) === "credit").reduce((s, t) => s + Math.abs(t.amount), 0);
    const debits = filtered.filter((t) => resolvedType(t) === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { credits, debits };
  }, [filtered]);

  // Get months that actually have data
  const availableMonths = useMemo(() => {
    const months = new Set(
      allTransactions.map((t) =>
        dateMode === "competence" ? getCompetenceMonth(t) : t.date.slice(0, 7)
      )
    );
    return Array.from(months).sort().reverse();
  }, [allTransactions, dateMode]);

  // Build month options only for months with data
  const monthOptions = useMemo(() => {
    // Count transactions per month for display
    const countByMonth: Record<string, number> = {};
    allTransactions.forEach((tx) => {
      const m = tx.date.slice(0, 7);
      countByMonth[m] = (countByMonth[m] || 0) + 1;
    });

    return [
      { value: "all", label: `Todos os períodos (${allTransactions.length})` },
      ...availableMonths.map((m) => {
        const d = parseISO(m + "-01");
        const label = format(d, "MMMM 'de' yyyy", { locale: ptBR });
        return {
          value: m,
          label: `${label.charAt(0).toUpperCase() + label.slice(1)} (${countByMonth[m] || 0})`,
        };
      }),
    ];
  }, [availableMonths, allTransactions]);

  // Get unique categories from actual data
  const availableCategories = useMemo(() => {
    const cats = new Set(allTransactions.map((t) => t.category).filter(Boolean));
    return Array.from(cats).sort() as string[];
  }, [allTransactions]);

  const exportCSV = () => {
    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
    const rows = filtered.map((tx) => [
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      getCategoryInfo(tx.category).pt,
      resolvedType(tx) === "credit" ? "Receita" : "Despesa",
      Math.abs(tx.amount).toFixed(2).replace(".", ","),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes-${monthFilter !== "all" ? monthFilter : format(new Date(), "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = search || categoryFilter !== "all" || typeFilter !== "all" || monthFilter !== "all" || creditFilter !== "all" || !!dateRange;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setMonthFilter("all");
    setCreditFilter("all");
    setDateRange(null);
  };

  const selectedMonthLabel = monthOptions.find((m) => m.value === monthFilter)?.label ?? "Todos os períodos";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Transações",
              val: String(filtered.length),
              sub: `de ${allTransactions.length} no total`,
              color: "text-foreground",
            },
            {
              label: "Total Receitas",
              val: formatCurrency(totals.credits),
              sub: selectedMonthLabel,
              color: "text-emerald-400",
            },
            {
              label: "Total Despesas",
              val: formatCurrency(totals.debits),
              sub: selectedMonthLabel,
              color: "text-rose-400",
            },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Date mode toggle */}
              <button
                onClick={() => {
                  setDateMode(dateMode === "liquidation" ? "competence" : "liquidation");
                  setMonthFilter("all"); // reset month filter when switching mode
                }}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs transition-all whitespace-nowrap ${
                  dateMode === "competence"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                title={dateMode === "liquidation" ? "Usando data de liquidação — clique para usar data de competência" : "Usando data de competência — clique para usar data de liquidação"}
              >
                {dateMode === "competence" ? "📅 Competência" : "📅 Liquidação"}
              </button>

              {/* Date range picker */}
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  if (range) setMonthFilter("all"); // clear month filter when range is set
                }}
                placeholder="Período personalizado"
              />

              {/* Month picker — hidden when date range active */}
              {!dateRange && <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[200px] h-9 gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>}

              {/* Category */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[190px] h-9">
                  <SelectValue placeholder="Todas categorias" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <Separator className="my-1" />
                  {getCategoriesGrouped()
                    .filter((group) =>
                      group.items.some((item) => availableCategories.includes(item.key))
                    )
                    .map((group) => (
                      <div key={group.groupKey}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-popover sticky top-0">
                          {group.groupEmoji} {group.groupPt}
                        </div>
                        {group.items
                          .filter((item) => availableCategories.includes(item.key))
                          .map((item) => (
                            <SelectItem key={item.key} value={item.key} className="pl-6">
                              {item.emoji} {item.pt}
                            </SelectItem>
                          ))}
                      </div>
                    ))}
                </SelectContent>
              </Select>

              {/* Type */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Receitas + Despesas</SelectItem>
                  <SelectItem value="credit">✅ Só Receitas</SelectItem>
                  <SelectItem value="debit">❌ Só Despesas</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 h-9 text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" /> Limpar tudo
                </Button>
              )}

              {/* Credit card filter toggle */}
              <button
                onClick={() => setCreditFilter(
                  creditFilter === "all" ? "credit_card" :
                  creditFilter === "credit_card" ? "debit_account" : "all"
                )}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm transition-all ${
                  creditFilter === "credit_card"
                    ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                    : creditFilter === "debit_account"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {creditFilter === "credit_card" ? "💳 Cartão" :
                 creditFilter === "debit_account" ? "🏦 Conta" : "💳 / 🏦"}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIgnored(!showIgnored)}
                className={`gap-1.5 h-9 ${showIgnored ? "border-sky-500/50 text-sky-400" : ""}`}
              >
                {showIgnored ? "🙈 Ocultar ignoradas" : "👁 Ver ignoradas"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="gap-1.5 h-9 ml-auto"
                disabled={filtered.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV ({filtered.length})
              </Button>
            </div>

            {/* Active filter badges */}
            {hasFilters && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Ativos:</span>
                {monthFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => setMonthFilter("all")}
                  >
                    📅 {selectedMonthLabel} <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {search && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => setSearch("")}
                  >
                    🔍 "{search}" <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => setCategoryFilter("all")}
                  >
                    {getCategoryInfo(categoryFilter).emoji} {getCategoryInfo(categoryFilter).pt} <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {typeFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => setTypeFilter("all")}
                  >
                    {typeFilter === "credit" ? "✅ Receitas" : "❌ Despesas"} <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {creditFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 cursor-pointer"
                    onClick={() => setCreditFilter("all")}
                  >
                    {creditFilter === "credit_card" ? "💳 Cartão" : "🏦 Conta"} <X className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table — no maxRows limit */}
        <TransactionsTable
          transactions={filtered}
          loading={loading}
          title={`${filtered.length} transação${filtered.length !== 1 ? "ões" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`}
          maxRows={9999}
          scrollable={false}
          showIgnored={showIgnored}
          onIgnoreChange={handleIgnoreChange}
          onTransactionUpdate={handleTransactionUpdate}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
