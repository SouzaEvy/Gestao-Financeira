"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Shield,
  Zap,
  TrendingUp,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Link2,
    title: "Open Finance",
    desc: "Conecte todos os seus bancos e carteiras em um único lugar via Pluggy.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Inteligentes",
    desc: "Visualize seus gastos por categoria, compare meses e identifique padrões.",
  },
  {
    icon: CreditCard,
    title: "Controle de Gastos",
    desc: "Defina limites por categoria e receba alertas quando estiver perto do limite.",
  },
  {
    icon: Shield,
    title: "100% Seguro",
    desc: "Seus dados bancários nunca passam pelos nossos servidores. Conexão direta via Pluggy.",
  },
  {
    icon: Zap,
    title: "Tempo Real",
    desc: "Transações atualizadas em tempo real via Supabase Realtime.",
  },
  {
    icon: TrendingUp,
    title: "Metas Financeiras",
    desc: "Defina metas e acompanhe sua evolução mês a mês.",
  },
];

const banks = ["Itaú", "Bradesco", "Nubank", "Santander", "C6", "Inter", "XP", "BTG"];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background gradient mesh */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-sky-500/5 blur-3xl" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Finança</span>
        </div>
        <nav className="flex items-center gap-3">
          <SignedOut>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Entrar</Link>
            </Button>
            <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white" asChild>
              <Link href="/sign-up">Começar grátis</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white" asChild>
              <Link href="/dashboard">Ir para o App</Link>
            </Button>
            <UserButton />
          </SignedIn>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-400 px-4 py-1.5"
            >
              <Zap className="h-3 w-3" />
              Open Finance · Pluggy · Supabase Realtime
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl text-5xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            Sua vida financeira,{" "}
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              unificada
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Conecte todos os seus bancos via Open Finance, acompanhe seus gastos
            em tempo real e tome decisões financeiras inteligentes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 px-8"
              asChild
            >
              <Link href="/sign-up">
                Começar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/dashboard">Ver demo</Link>
            </Button>
          </motion.div>

          {/* Bank logos strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="text-xs text-muted-foreground mr-2">
              Compatível com:
            </span>
            {banks.map((bank) => (
              <span
                key={bank}
                className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {bank}
              </span>
            ))}
            <span className="text-xs text-muted-foreground">+ 200 bancos</span>
          </motion.div>
        </div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mx-auto max-w-5xl"
        >
          <div className="rounded-2xl border border-border bg-card/50 p-1 shadow-2xl shadow-black/40 glass">
            <div className="rounded-xl bg-card p-4">
              {/* Fake dashboard preview */}
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
                <div className="ml-auto h-2 w-48 rounded-full bg-border" />
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Saldo Total", val: "R$ 12.840", color: "text-emerald-400" },
                  { label: "Gastos do Mês", val: "R$ 3.290", color: "text-rose-400" },
                  { label: "Economia", val: "R$ 2.100", color: "text-sky-400" },
                  { label: "Orçamento", val: "68%", color: "text-yellow-400" },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-border bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className={`text-lg font-bold mt-1 ${c.color}`}>{c.val}</p>
                  </div>
                ))}
              </div>
              <div className="h-40 rounded-lg border border-border bg-background/50 flex items-end gap-2 px-4 pb-4">
                {[35, 55, 42, 70, 50, 88, 65, 72, 48, 60, 80, 45].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                    <div
                      className="rounded-sm bg-sky-500/30 hover:bg-sky-500/50 transition-colors"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow behind the card */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-sky-500/5 blur-2xl" />
        </motion.div>

        {/* Features */}
        <section className="py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">
              Tudo que você precisa para controlar suas finanças
            </h2>
            <p className="mt-3 text-muted-foreground">
              Um produto completo, construído com as melhores tecnologias do mercado.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group rounded-xl border border-border bg-card p-6 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all duration-300"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center">
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Pronto para começar?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Conecte seus bancos em menos de 2 minutos. Gratuito para começar.
            </p>
            <Button
              size="lg"
              className="mt-8 gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 px-10"
              asChild
            >
              <Link href="/sign-up">
                Criar minha conta <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Finança. Construído com Next.js 15, Pluggy, Supabase & Clerk.</p>
      </footer>
    </div>
  );
}
