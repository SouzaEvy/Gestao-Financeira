import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────
// Currency
// ─────────────────────────────────────────────
export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─────────────────────────────────────────────
// Dates
// ─────────────────────────────────────────────
export function formatDate(date: string | Date, fmt = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: ptBR });
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, "dd MMM");
}

export function formatMonthYear(date: string | Date): string {
  return formatDate(date, "MMM yyyy");
}

export function startOfCurrentMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

export function endOfCurrentMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}

// ─────────────────────────────────────────────
// Category map — covers Pluggy categories
// including real Brazilian bank categories
// ─────────────────────────────────────────────
export const CATEGORY_MAP: Record<string, { pt: string; color: string; emoji: string }> = {
  // Food & Drink
  "Food": { pt: "Alimentação", color: "#f97316", emoji: "🍔" },
  "Food and Drink": { pt: "Alimentação", color: "#f97316", emoji: "🍔" },
  "Eating out": { pt: "Restaurantes", color: "#fb923c", emoji: "🍽️" },
  "Restaurants": { pt: "Restaurantes", color: "#fb923c", emoji: "🍽️" },
  "Supermarkets": { pt: "Mercado", color: "#84cc16", emoji: "🛒" },
  "Groceries": { pt: "Mercado", color: "#84cc16", emoji: "🛒" },

  // Transport
  "Transport": { pt: "Transporte", color: "#3b82f6", emoji: "🚌" },
  "Transportation": { pt: "Transporte", color: "#3b82f6", emoji: "🚌" },
  "Uber": { pt: "Transporte", color: "#3b82f6", emoji: "🚗" },
  "Public Transport": { pt: "Transporte Público", color: "#60a5fa", emoji: "🚇" },
  "Taxi": { pt: "Táxi / App", color: "#3b82f6", emoji: "🚕" },

  // Health
  "Health": { pt: "Saúde", color: "#ec4899", emoji: "💊" },
  "Pharmacy": { pt: "Farmácia", color: "#f472b6", emoji: "💊" },
  "Healthcare": { pt: "Saúde", color: "#ec4899", emoji: "🏥" },

  // Entertainment
  "Entertainment": { pt: "Entretenimento", color: "#a855f7", emoji: "🎬" },
  "Leisure": { pt: "Lazer", color: "#a855f7", emoji: "🎮" },

  // Shopping
  "Shopping": { pt: "Compras", color: "#e879f9", emoji: "🛍️" },
  "Clothing": { pt: "Vestuário", color: "#d946ef", emoji: "👕" },

  // Services
  "Services": { pt: "Serviços", color: "#8b5cf6", emoji: "⚙️" },
  "Online Services": { pt: "Serviços Online", color: "#8b5cf6", emoji: "💻" },
  "Streaming": { pt: "Streaming", color: "#7c3aed", emoji: "📺" },
  "Subscriptions": { pt: "Assinaturas", color: "#7c3aed", emoji: "📱" },

  // Education
  "Education": { pt: "Educação", color: "#0ea5e9", emoji: "📚" },

  // Housing
  "Housing": { pt: "Moradia", color: "#14b8a6", emoji: "🏠" },
  "Rent": { pt: "Aluguel", color: "#0d9488", emoji: "🏠" },
  "Utilities": { pt: "Contas", color: "#0891b2", emoji: "💡" },

  // Income
  "Salary": { pt: "Salário", color: "#10b981", emoji: "💰" },
  "Income": { pt: "Receita", color: "#10b981", emoji: "💰" },

  // Transfers & PIX
  "Transfer": { pt: "Transferência", color: "#6b7280", emoji: "↔️" },
  "Transfers": { pt: "Transferência", color: "#6b7280", emoji: "↔️" },
  "Transfer - PIX": { pt: "PIX", color: "#06b6d4", emoji: "⚡" },
  "PIX": { pt: "PIX", color: "#06b6d4", emoji: "⚡" },
  "Pix": { pt: "PIX", color: "#06b6d4", emoji: "⚡" },

  // Investments
  "Investment": { pt: "Investimento", color: "#f59e0b", emoji: "📈" },
  "Investments": { pt: "Investimento", color: "#f59e0b", emoji: "📈" },
  "CDB": { pt: "CDB / Renda Fixa", color: "#f59e0b", emoji: "📈" },

  // Other
  "Other": { pt: "Outros", color: "#6b7280", emoji: "📦" },
  "Uncategorized": { pt: "Outros", color: "#6b7280", emoji: "📦" },
};

export function getCategoryInfo(category: string | null): {
  pt: string;
  color: string;
  emoji: string;
} {
  if (!category) return { pt: "Outros", color: "#6b7280", emoji: "📦" };
  return CATEGORY_MAP[category] ?? { pt: category, color: "#6b7280", emoji: "📦" };
}

// ─────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function generateBudgetColors(): string[] {
  return [
    "#0ea5e9", "#10b981", "#f97316", "#a855f7",
    "#ec4899", "#f59e0b", "#3b82f6", "#84cc16",
  ];
}
