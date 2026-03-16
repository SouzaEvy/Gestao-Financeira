"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Trash2, Loader2, CheckCircle2, AlertCircle,
  Clock, RefreshCw, Shield, Zap, Database,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Navbar } from "@/components/Navbar";
import { PluggyConnectButton } from "@/components/PluggyConnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchData } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import type { ConnectedAccount } from "@/types";

function StatusBadge({ status }: { status: ConnectedAccount["status"] }) {
  const map = {
    updated: { label: "Sincronizado", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    updating: { label: "Atualizando", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: RefreshCw },
    login_error: { label: "Erro de login", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: AlertCircle },
    outdated: { label: "Desatualizado", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  };
  const s = map[status] ?? map.outdated;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.color}`}>
      <s.icon className={`h-3 w-3 ${status === "updating" ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchData<ConnectedAccount>("connected_accounts");
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
      toast.error("Erro ao carregar contas conectadas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const syncAccount = async (account: ConnectedAccount) => {
    setSyncingId(account.id);
    try {
      const res = await fetch("/api/pluggy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: account.item_id }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${account.name} sincronizado!`);
      await loadAccounts();
    } catch {
      toast.error("Erro ao sincronizar. Tente novamente.");
    } finally {
      setSyncingId(null);
    }
  };

  const removeAccount = async (account: ConnectedAccount) => {
    if (!confirm(`Desconectar ${account.name}? Suas transações serão mantidas.`)) return;
    setRemovingId(account.id);
    try {
      const res = await fetch("/api/pluggy/disconnect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: account.item_id, accountId: account.id }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${account.name} desconectado.`);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    } catch {
      toast.error("Erro ao desconectar.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">

        {/* Profile */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
                <AvatarFallback className="text-base bg-sky-500/20 text-sky-400">
                  {getInitials(user?.fullName ?? user?.emailAddresses[0]?.emailAddress ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user?.fullName ?? "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
                <Badge variant="outline" className="mt-1.5 text-xs border-sky-500/30 text-sky-400 bg-sky-500/10">
                  Plano Gratuito
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected accounts */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Contas Conectadas</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gerencie seus bancos conectados via Open Finance
              </p>
            </div>
            <PluggyConnectButton
              onSuccess={() => loadAccounts()}
              label="Adicionar banco"
            />
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y divide-border">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-5">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 mb-4">
                  <Database className="h-7 w-7 text-sky-400" />
                </div>
                <p className="font-semibold mb-1">Nenhum banco conectado</p>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                  Conecte sua conta bancária para começar a ver suas transações e saldo.
                </p>
                <PluggyConnectButton onSuccess={() => loadAccounts()} />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {accounts.map((account, i) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 p-5 hover:bg-accent/20 transition-colors group"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
                      {account.logo_url ? (
                        <Image
                          src={account.logo_url}
                          alt={account.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          {account.name[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{account.name}</p>
                        <StatusBadge status={account.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {account.last_synced_at
                          ? `Última sync: ${format(
                              new Date(account.last_synced_at),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}`
                          : "Sincronizando pela primeira vez..."}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                        onClick={() => syncAccount(account)}
                        disabled={syncingId === account.id}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncingId === account.id ? "animate-spin" : ""}`} />
                        Sincronizar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                        onClick={() => removeAccount(account)}
                        disabled={removingId === account.id}
                      >
                        {removingId === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Status */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="font-semibold text-sm">Segurança</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Suas credenciais bancárias nunca são armazenadas em nossos servidores.
                Conexão segura via <strong className="text-foreground">Pluggy Open Finance</strong>,
                regulado pelo Banco Central do Brasil.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
                  <Zap className="h-4 w-4 text-sky-400" />
                </div>
                <p className="font-semibold text-sm">Status da API</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Pluggy API", ok: true },
                  { label: "Supabase", ok: true },
                  { label: "Autenticação", ok: true },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-400">Operacional</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger zone */}
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-5">
            <p className="font-semibold text-sm text-rose-400 mb-1">Zona de Perigo</p>
            <p className="text-xs text-muted-foreground mb-4">
              Estas ações são irreversíveis. Prossiga com cautela.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              onClick={() => toast.error("Entre em contato com o suporte para excluir sua conta.")}
            >
              Excluir minha conta
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
