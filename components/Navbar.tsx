"use client";

import { usePathname } from "next/navigation";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Visão geral das suas finanças" },
  "/transactions": { title: "Transações", subtitle: "Histórico completo" },
  "/budgets": { title: "Orçamentos", subtitle: "Controle seus limites por categoria" },
  "/settings": { title: "Configurações", subtitle: "Gerencie suas contas conectadas" },
};

interface NavbarProps {
  onSync?: () => Promise<void>;
}

export function Navbar({ onSync }: NavbarProps) {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const info = pageTitles[pathname] ?? { title: "Finança", subtitle: "" };

  const handleSync = async () => {
    if (!onSync) return;
    setSyncing(true);
    try {
      await onSync();
      toast.success("Dados sincronizados com sucesso!");
    } catch {
      toast.error("Erro ao sincronizar. Tente novamente.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/30 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-base font-semibold">{info.title}</h1>
        <p className="text-xs text-muted-foreground">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {onSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-1.5 h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-sky-500" />
        </Button>
      </div>
    </header>
  );
}
