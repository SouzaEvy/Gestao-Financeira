"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PluggyConnectButtonProps {
  onSuccess?: (itemId: string, connectorName: string) => void;
  label?: string;
}

interface PluggyConnectConfig {
  connectToken: string;
  onSuccess: (data: {
    item: { id: string; connector: { name: string; imageUrl: string } };
  }) => void;
  onError: (error: { message: string }) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    PluggyConnect: {
      new (config: PluggyConnectConfig): { init: () => void };
      (config: PluggyConnectConfig): void;
    };
  }
}

function openPluggyConnect(config: PluggyConnectConfig) {
  const PC = window.PluggyConnect;

  // Try as constructor first, then as plain function
  try {
    const instance = new PC(config);
    if (instance && typeof instance.init === "function") {
      instance.init();
      return;
    }
  } catch {
    // Not a constructor — fall through
  }

  // Try as plain function
  try {
    (PC as unknown as (c: PluggyConnectConfig) => void)(config);
  } catch (err) {
    console.error("PluggyConnect invocation failed:", err);
    throw new Error("Não foi possível abrir o widget Pluggy.");
  }
}

export function PluggyConnectButton({
  onSuccess,
  label = "Conectar conta bancária",
}: PluggyConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (typeof window.PluggyConnect !== "undefined") {
      setScriptLoaded(true);
      return;
    }

    const existing = document.getElementById("pluggy-connect-script");
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "pluggy-connect-script";
    // Try the official CDN URL
    script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.1.0/pluggy-connect.js";
    script.async = true;

    script.onload = () => {
      console.log("[Pluggy] Script loaded, PluggyConnect:", typeof window.PluggyConnect);
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error("[Pluggy] Failed to load script from primary URL, trying fallback...");
      // Fallback URL
      const fallback = document.createElement("script");
      fallback.src = "https://cdn.pluggy.ai/connect/v2/connect.js";
      fallback.async = true;
      fallback.onload = () => {
        console.log("[Pluggy] Fallback script loaded");
        setScriptLoaded(true);
      };
      fallback.onerror = () => toast.error("Erro ao carregar o widget Pluggy.");
      document.body.appendChild(fallback);
    };

    document.body.appendChild(script);
  }, []);

  const handleConnect = useCallback(async () => {
    if (!scriptLoaded || typeof window.PluggyConnect === "undefined") {
      toast.error("Widget ainda carregando, aguarde um momento.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/pluggy/connect-token", { method: "POST" });
      if (!res.ok) throw new Error(`Erro ao obter token (${res.status})`);

      const data = await res.json();
      const accessToken = data.accessToken ?? data.apiKey ?? data.token;

      if (!accessToken) {
        console.error("[Pluggy] Token response:", data);
        throw new Error("Token de conexão inválido. Verifique suas credenciais Pluggy.");
      }

      openPluggyConnect({
        connectToken: accessToken,

        onSuccess: async ({ item }) => {
          toast.loading("Salvando conta...", { id: "saving-bank" });
          try {
            const saveRes = await fetch("/api/pluggy/connect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemId: item.id,
                connectorName: item.connector.name,
                logoUrl: item.connector.imageUrl,
              }),
            });
            if (!saveRes.ok) throw new Error("Falha ao salvar conta.");
            toast.success(`${item.connector.name} conectado!`, { id: "saving-bank" });
            onSuccess?.(item.id, item.connector.name);
          } catch (err) {
            toast.error("Conta conectada mas erro ao salvar.", { id: "saving-bank" });
            console.error(err);
          }
        },

        onError: ({ message }) => {
          toast.error(`Erro na conexão: ${message}`);
          setLoading(false);
        },

        onClose: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar.");
      setLoading(false);
    }
  }, [scriptLoaded, onSuccess]);

  return (
    <Button
      onClick={handleConnect}
      disabled={loading || !scriptLoaded}
      className="gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <PlusCircle className="h-4 w-4" />
      )}
      {!scriptLoaded ? "Carregando..." : loading ? "Abrindo..." : label}
    </Button>
  );
}
