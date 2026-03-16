"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transações" },
  { href: "/budgets", icon: Target, label: "Orçamentos" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative flex h-screen flex-col border-r border-border bg-card/50 backdrop-blur-sm"
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-4 border-b border-border">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-3 text-base font-semibold tracking-tight"
            >
              Finança
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2 pt-4">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-sky-500/15 text-sky-400"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active && "text-sky-400")} />
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {active && !collapsed && (
                      <motion.div
                        layoutId="active-pill"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400"
                      />
                    )}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* User */}
        <div className={cn("border-t border-border p-3 flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground truncate"
            >
              Minha conta
            </motion.span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground transition-colors z-10"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </motion.aside>
    </TooltipProvider>
  );
}
