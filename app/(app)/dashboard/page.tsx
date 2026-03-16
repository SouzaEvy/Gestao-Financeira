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
function CategoryBreakdown({
  transactions,
  loading,
  selectedMonth,
}: {
  transactions: Transaction[];
  loading: boolean;
  selectedMonth: string | null;
}) {
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

  // Filter by selected month if any
  const filtered = selectedMonth
    ? transactions.filter((t) => t.date.slice(0, 7) === selectedMonth)
    : transactions;

  const byCategory: Record<string, number> = {};
  filtered
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      const key = t.category || "Other";
      byCategory[key] = (byCategory[key] || 0) + Math.abs(t.amount);
    });

  const data = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat, value]) => {
      const info = getCategoryInfo(cat);
      return { name: info.pt, value: Math.round(value), color: info.color, emoji: info.emoji };
    });

  const subtitleMonth = selectedMonth
    ? format(parseISO(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })
    : "Todas as despesas";

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
        <p className="text-base font-semibold mb-0.5">Por categoria</p>
        <p className="text-xs text-muted-foreground mb-3 capitalize">{subtitleMonth}</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  background: "hsl(222 47% 9%)",
                  border: "1px solid hsl(222 47% 14%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(213 31% 91%)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                {/* ✅ Cor do texto mais clara */}
                <span className="truncate max-w-[110px]" style={{ color: "#ffffff" }}>
                  {item.emoji} {item.name}
                </span>
              </div>
              <span className="font-semibold tabular-nums" style={{ color: "#ffffff" }}>{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
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
  const [chartData, setChartData] = useState<MonthlyChartData[]>([]);
  // Selected month from chart click — "yyyy-MM" or null = all
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsData, txData] = await Promise.all([
        fetchData<ConnectedAccount>("connected_accounts"),
        fetchData<Transaction>("transactions", { noDateFilter: true }),
      ]);
      setAccounts(accountsData);
      setAllTransactions(txData);

      // Build chart data grouped by month
      const byMonth: Record<string, { rec: number; desp: number; key: string }> = {};
      txData.forEach((t) => {
        const m = t.date.slice(0, 7);
        if (!byMonth[m]) byMonth[m] = { rec: 0, desp: 0, key: m };
        if (t.type === "credit") byMonth[m].rec += t.amount;
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

  // ── Derived data filtered by selectedMonth ──
  const filteredTransactions = useMemo(() => {
    if (!selectedMonth) return allTransactions;
    return allTransactions.filter((t) => t.date.slice(0, 7) === selectedMonth);
  }, [allTransactions, selectedMonth]);

  const summary = useMemo((): DashboardSummary => {
    const txs = filteredTransactions;
    const debits = txs.filter((t) => t.type === "debit");
    const credits = txs.filter((t) => t.type === "credit");
    const monthlyExpenses = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
    const monthlyIncome = credits.reduce((s, t) => s + t.amount, 0);

    // Balance from latest transaction per account
    const latestByAccount: Record<string, number> = {};
    allTransactions.forEach((t) => {
      if (t.balance != null && !(t.account_id in latestByAccount)) {
        latestByAccount[t.account_id] = t.balance;
      }
    });
    const totalBalance = Object.values(latestByAccount).reduce((a, b) => a + b, 0);

    return {
      totalBalance,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      budgetUsagePercent: 0,
      balanceChange: monthlyIncome - monthlyExpenses,
    };
  }, [filteredTransactions, allTransactions]);

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

        {/* ── Month indicator ── */}
        {selectedMonth && !loading && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Visualizando:</span>
            <Badge
              variant="outline"
              className="gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-400 cursor-pointer capitalize"
              onClick={() => setSelectedMonth(null)}
            >
              📅 {selectedMonthLabel} · clique para ver tudo ✕
            </Badge>
          </div>
        )}

        {/* Summary cards — reactive to selectedMonth */}
        <DashboardCards summary={summary} loading={loading} />

        {/* Chart + Category */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <BalanceChart
              data={chartData}
              loading={loading}
              selectedMonth={selectedMonth}
              onMonthClick={(monthKey) => setSelectedMonth(monthKey === selectedMonth ? null : monthKey)}
            />
          </div>
          <div className="lg:col-span-2">
            <CategoryBreakdown
              transactions={allTransactions}
              loading={loading}
              selectedMonth={selectedMonth}
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
