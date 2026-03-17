"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { DashboardCards } from "@/components/DashboardCards";
import { BalanceChart } from "@/components/BalanceChart";
import { TransactionsTable } from "@/components/TransactionsTable";
import { PluggyConnectButton } from "@/components/PluggyConnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchData } from "@/lib/api";
import { formatCurrency, formatDate, getCategoryInfo } from "@/lib/utils";
import type { DashboardSummary, MonthlyChartData, Transaction, ConnectedAccount } from "@/types";
import { resolvedType, resolvedCategory } from "@/types";

function generateMockChartData(): MonthlyChartData[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const receitas = 4000 + Math.random() * 3000;
    const despesas = 2000 + Math.random() * 2500;
    return {
      month: format(d, "MMM/yy", { locale: ptBR }),
      receitas: Math.round(receitas),
      despesas: Math.round(despesas),
      economia: Math.round(receitas - despesas),
    };
  });
}

// ─────────────────────────────────────────────
// Category Breakdown
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Account Split chart — Bank vs Credit Card
// ─────────────────────────────────────────────
function AccountSplitChart({
  transactions,
  loading,
}: {
  transactions: Transaction[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const debits = transactions.filter((t) => resolvedType(t) === "debit");
  const bankTotal = debits
    .filter((t) => !t.is_credit_card)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const cardTotal = debits
    .filter((t) => t.is_credit_card)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const total = bankTotal + cardTotal;

  const bankPct = total > 0 ? (bankTotal / total) * 100 : 0;
  const cardPct = total > 0 ? (cardTotal / total) * 100 : 0;

  const data = [
    { name: "Conta corrente", value: Math.round(bankTotal), color: "#10b981", emoji: "🏦" },
    { name: "Cartão de crédito", value: Math.round(cardTotal), color: "#0ea5e9", emoji: "💳" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-2xl mb-2">📊</span>
          <p className="text-xs text-muted-foreground">Sem despesas no período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <p className="text-sm font-semibold mb-0.5">Conta vs Cartão</p>
        <p className="text-xs text-muted-foreground mb-4">Distribuição das despesas</p>

        {/* Stacked bar */}
        <div className="h-8 w-full rounded-lg overflow-hidden flex mb-4">
          {bankTotal > 0 && (
            <div
              className="h-full flex items-center justify-center text-xs font-medium text-white transition-all"
              style={{ width: `${bankPct}%`, background: "#10b981", minWidth: bankPct > 10 ? "auto" : 0 }}
            >
              {bankPct > 15 ? `${bankPct.toFixed(0)}%` : ""}
            </div>
          )}
          {cardTotal > 0 && (
            <div
              className="h-full flex items-center justify-center text-xs font-medium text-white transition-all"
              style={{ width: `${cardPct}%`, background: "#0ea5e9", minWidth: cardPct > 10 ? "auto" : 0 }}
            >
              {cardPct > 15 ? `${cardPct.toFixed(0)}%` : ""}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {[
            { label: "🏦 Conta corrente", value: bankTotal, pct: bankPct, color: "#10b981" },
            { label: "💳 Cartão de crédito", value: cardTotal, pct: cardPct, color: "#0ea5e9" },
          ].filter((d) => d.value > 0).map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                <span style={{ color: "#ffffff" }}>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.pct.toFixed(0)}%</span>
                <span className="font-semibold tabular-nums" style={{ color: "#ffffff" }}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
            <span className="text-muted-foreground">Total despesas</span>
            <span className="font-bold" style={{ color: "#f43f5e" }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryBreakdown({
  transactions,
  loading,
  selectedMonth,
}: {
  transactions: Transaction[];
  loading: boolean;
  selectedMonth: string | null;
}) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-40 w-40 rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Build category totals
  const byCategory: Record<string, { total: number; catKey: string }> = {};
  transactions
    .filter((t) => resolvedType(t) === "debit")
    .forEach((t) => {
      const key = resolvedCategory(t) || "Other";
      if (!byCategory[key]) byCategory[key] = { total: 0, catKey: key };
      byCategory[key].total += Math.abs(t.amount);
    });

  const data = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6)
    .map(([cat, { total }]) => {
      const info = getCategoryInfo(cat);
      return { name: info.pt, catKey: cat, value: Math.round(total), color: info.color, emoji: info.emoji };
    });

  // Transactions for selected category
  const catTransactions = selectedCat
    ? transactions.filter((t) => {
        const cat = resolvedCategory(t) || "Other";
        return resolvedType(t) === "debit" && cat === selectedCat;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const subtitleMonth = selectedMonth
    ? format(parseISO(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })
    : "Todas as despesas";

  const selectedCatInfo = selectedCat ? getCategoryInfo(selectedCat) : null;

  if (data.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center h-full py-10 text-center">
          <span className="text-3xl mb-2">🥧</span>
          <p className="text-sm text-muted-foreground">Sem despesas em {subtitleMonth}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-base font-semibold">Por categoria</p>
          {selectedCat && (
            <button
              onClick={() => setSelectedCat(null)}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              ← Ver todas
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3 capitalize">
          {selectedCat && selectedCatInfo
            ? `${selectedCatInfo.emoji} ${selectedCatInfo.pt} · ${subtitleMonth}`
            : subtitleMonth}
        </p>

        {/* Pie chart */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                onClick={(entry) => {
                  setSelectedCat(
                    selectedCat === entry.catKey ? null : entry.catKey
                  );
                }}
                style={{ cursor: "pointer" }}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    opacity={
                      !selectedCat || selectedCat === entry.catKey ? 0.9 : 0.2
                    }
                    stroke={selectedCat === entry.catKey ? "#ffffff" : "none"}
                    strokeWidth={selectedCat === entry.catKey ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  background: "hsl(222 47% 9%)",
                  border: "1px solid hsl(222 47% 14%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend OR transaction list */}
        {!selectedCat ? (
          // Default: category legend
          <div className="space-y-1.5 mt-2">
            {data.map((item) => (
              <button
                key={item.catKey}
                onClick={() => setSelectedCat(item.catKey)}
                className="w-full flex items-center justify-between text-xs hover:bg-accent/30 rounded-md px-1 py-1 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="truncate max-w-[110px] group-hover:text-sky-400 transition-colors" style={{ color: "#ffffff" }}>
                    {item.emoji} {item.name}
                  </span>
                </div>
                <span className="font-semibold tabular-nums" style={{ color: "#ffffff" }}>
                  {formatCurrency(item.value)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          // Selected: transaction list for that category
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {catTransactions.length} transaç{catTransactions.length !== 1 ? "ões" : "ão"}
              </span>
              <span className="text-xs font-semibold" style={{ color: selectedCatInfo?.color }}>
                {formatCurrency(catTransactions.reduce((s, t) => s + Math.abs(t.amount), 0))}
              </span>
            </div>
            <div className="space-y-0 max-h-[160px] overflow-y-auto">
              {catTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs truncate" style={{ color: "#e2e8f0" }}>
                      {tx.description.replace(/^(COMPRA CARTAO - No estabelecimento |PIX ENVIADO - Cp :[0-9]+-|PIX ENVIADO   |DEBITO VISA ELECTRON BRASIL\s+\d{2}\/\d{2}\s+)/, "").slice(0, 40)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-rose-400 shrink-0">
                    -{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null); // null = todas
  const [chartData, setChartData] = useState<MonthlyChartData[]>([]);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [balanceAccounts, setBalanceAccounts] = useState<Array<{ name: string; balance: number; type: string }>>([]);
  // Selected month from chart click — "yyyy-MM" or null = all
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsData, txData, balanceRes] = await Promise.all([
        fetchData<ConnectedAccount>("connected_accounts"),
        fetchData<Transaction>("transactions", { noDateFilter: true }),
        fetch("/api/balance").then((r) => r.json()).catch(() => ({ totalBalance: null })),
      ]);

      if (balanceRes?.totalBalance !== undefined && balanceRes.totalBalance !== null) {
        setRealBalance(balanceRes.totalBalance);
        setBalanceAccounts(balanceRes.accounts ?? []);
      }
      setAccounts(accountsData);
      setAllTransactions(txData);

      // Build chart data — will be recalculated reactively via accountFilteredTx
      const byMonth: Record<string, { rec: number; desp: number; key: string }> = {};
      txData.forEach((t) => {
        const m = t.date.slice(0, 7);
        if (!byMonth[m]) byMonth[m] = { rec: 0, desp: 0, key: m };
        if (resolvedType(t) === "credit") byMonth[m].rec += t.amount;
        else byMonth[m].desp += Math.abs(t.amount);
      });

      const sortedMonths = Object.keys(byMonth).sort().slice(-6);
      const months: MonthlyChartData[] = sortedMonths.map((m) => {
        const d = parseISO(m + "-01");
        const { rec, desp } = byMonth[m];
        return {
          month: format(d, "MMM/yy", { locale: ptBR }),
          monthKey: m, // ← we'll use this for filtering
          receitas: Math.round(rec),
          despesas: Math.round(desp),
          economia: Math.round(rec - desp),
        };
      });

      setChartData(months.length > 0 ? months : generateMockChartData());

      // Default selected month = most recent with data
      if (sortedMonths.length > 0 && !selectedMonth) {
        setSelectedMonth(sortedMonths[sortedMonths.length - 1]);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setChartData(generateMockChartData());
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Derived data: filter by account then by month ──
  const accountFilteredTx = useMemo(() => {
    if (!selectedAccountId) return allTransactions;
    return allTransactions.filter((t) => t.item_id === selectedAccountId);
  }, [allTransactions, selectedAccountId]);

  // Recalculate chart when account filter changes
  const reactiveChartData = useMemo(() => {
    if (accountFilteredTx.length === 0) return chartData;
    const byMonth: Record<string, { rec: number; desp: number }> = {};
    accountFilteredTx.forEach((t) => {
      const m = t.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { rec: 0, desp: 0 };
      if (resolvedType(t) === "credit") byMonth[m].rec += t.amount;
      else byMonth[m].desp += Math.abs(t.amount);
    });
    const sortedMonths = Object.keys(byMonth).sort().slice(-6);
    if (sortedMonths.length === 0) return chartData;
    return sortedMonths.map((m) => {
      const d = parseISO(m + "-01");
      const { rec, desp } = byMonth[m];
      return {
        month: format(d, "MMM/yy", { locale: ptBR }),
        monthKey: m,
        receitas: Math.round(rec),
        despesas: Math.round(desp),
        economia: Math.round(rec - desp),
      };
    });
  }, [accountFilteredTx, chartData]);

  const filteredTransactions = useMemo(() => {
    if (!selectedMonth) return accountFilteredTx;
    return accountFilteredTx.filter((t) => t.date.slice(0, 7) === selectedMonth);
  }, [accountFilteredTx, selectedMonth]);

  const summary = useMemo((): DashboardSummary => {
    const txs = filteredTransactions;
    const debits = txs.filter((t) => resolvedType(t) === "debit");
    const credits = txs.filter((t) => resolvedType(t) === "credit");
    const monthlyExpenses = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
    const monthlyIncome = credits.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Use real balance from Pluggy API if available
    // Falls back to last known tx balance
    const totalBalance = realBalance ?? (() => {
      const latestByAccount: Record<string, number> = {};
      accountFilteredTx.forEach((t) => {
        if (t.balance != null && !(t.account_id in latestByAccount)) {
          latestByAccount[t.account_id] = t.balance;
        }
      });
      return Object.values(latestByAccount).reduce((a, b) => a + b, 0);
    })();

    return {
      totalBalance,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      budgetUsagePercent: 0,
      balanceChange: monthlyIncome - monthlyExpenses,
    };
  }, [filteredTransactions, accountFilteredTx, realBalance]);

  const handleSync = async () => {
    if (accounts.length === 0) return;
    setSyncing(true);
    try {
      for (const account of accounts) {
        await fetch("/api/pluggy/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: account.item_id }),
        });
      }
      toast.success("Dados sincronizados!");
      await loadDashboard();
    } catch {
      toast.error("Erro ao sincronizar.");
    } finally {
      setSyncing(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const selectedMonthLabel = selectedMonth
    ? format(parseISO(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })
    : "todos os meses";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar onSync={handleSync} />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-semibold">
              {greeting()},{" "}
              <span className="text-sky-400">{user?.firstName ?? "usuário"}</span> 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy")}
            </p>
          </div>

          {accounts.length === 0 ? (
            <PluggyConnectButton onSuccess={loadDashboard} />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {accounts.length} conta{accounts.length > 1 ? "s" : ""} conectada{accounts.length > 1 ? "s" : ""}
              </Badge>
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Sincronizando..." : "Atualizar"}
              </Button>
            </div>
          )}
        </motion.div>

        {/* No accounts CTA */}
        {!loading && accounts.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-sky-500/20 bg-sky-500/5">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15">
                  <Sparkles className="h-6 w-6 text-sky-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold">Conecte sua primeira conta</p>
                  <p className="text-sm text-muted-foreground mt-1">Vincule seu banco para ver seu saldo e transações em tempo real.</p>
                </div>
                <PluggyConnectButton onSuccess={loadDashboard} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Account + Month filters ── */}
        {(accounts.length > 1 || selectedMonth) && !loading && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtros:</span>

            {/* Account filter — only show if more than 1 account */}
            {accounts.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={`cursor-pointer px-3 py-1 gap-1.5 transition-all ${
                    !selectedAccountId
                      ? "border-sky-500/50 bg-sky-500/15 text-sky-400"
                      : "border-border text-muted-foreground hover:border-sky-500/30"
                  }`}
                  onClick={() => setSelectedAccountId(null)}
                >
                  🏦 Todas as contas
                </Badge>
                {accounts.map((acc) => (
                  <Badge
                    key={acc.id}
                    variant="outline"
                    className={`cursor-pointer px-3 py-1 gap-1.5 transition-all ${
                      selectedAccountId === acc.item_id
                        ? "border-sky-500/50 bg-sky-500/15 text-sky-400"
                        : "border-border text-muted-foreground hover:border-sky-500/30"
                    }`}
                    onClick={() => setSelectedAccountId(
                      selectedAccountId === acc.item_id ? null : acc.item_id
                    )}
                  >
                    {acc.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Month filter */}
            {selectedMonth && (
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-pointer capitalize"
                onClick={() => setSelectedMonth(null)}
              >
                📅 {selectedMonthLabel} ✕
              </Badge>
            )}
          </div>
        )}

        {/* Summary cards — reactive to selectedMonth */}
        <DashboardCards summary={summary} loading={loading} balanceAccounts={balanceAccounts} />

        {/* Chart + Category + Account Split */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <BalanceChart
              data={reactiveChartData}
              loading={loading}
              selectedMonth={selectedMonth}
              onMonthClick={(monthKey) => setSelectedMonth(monthKey === selectedMonth ? null : monthKey)}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <CategoryBreakdown
              transactions={filteredTransactions}
              loading={loading}
              selectedMonth={selectedMonth}
            />
            <AccountSplitChart
              transactions={filteredTransactions}
              loading={loading}
            />
          </div>
        </div>

        {/* Recent transactions — also filtered */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Últimas transações {selectedMonth ? `· ${selectedMonthLabel}` : ""}
            </h3>
            <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs text-sky-400 hover:text-sky-300" asChild>
              <Link href="/transactions">Ver todas <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          <TransactionsTable transactions={filteredTransactions} loading={loading} maxRows={8} scrollable={true} />
        </div>
      </main>
    </div>
  );
}
