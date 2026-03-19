"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import {
  Menu, X, LayoutDashboard, ArrowLeftRight,
  Target, Settings, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transações" },
  { href: "/budgets", icon: Target, label: "Orçamentos" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="flex lg:hidden h-14 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">Finança</span>
        </div>

        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <button
            onClick={() => setOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl lg:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex h-14 items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold">Finança</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 space-y-1 p-3 pt-4">
                {navItems.map((item, i) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-all",
                          active
                            ? "bg-sky-500/15 text-sky-400"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 shrink-0", active && "text-sky-400")} />
                        {item.label}
                        {active && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-3">
                  <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
                  <span className="text-xs text-muted-foreground">Minha conta</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
