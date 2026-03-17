import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
// Category structure — with parent grouping
// ─────────────────────────────────────────────

export interface CategoryDef {
  pt: string;
  color: string;
  emoji: string;
  parent: string; // parent group key
}

export interface CategoryGroup {
  pt: string;
  color: string;
  emoji: string;
}

// Parent groups — shown as headers in selectors
export const CATEGORY_GROUPS: Record<string, CategoryGroup> = {
  alimentacao:      { pt: "Alimentação",       color: "#f97316", emoji: "🍔" },
  transporte:       { pt: "Transporte",         color: "#3b82f6", emoji: "🚗" },
  saude:            { pt: "Saúde",              color: "#ec4899", emoji: "💊" },
  lazer:            { pt: "Lazer",              color: "#a855f7", emoji: "🎬" },
  compras:          { pt: "Compras",            color: "#e879f9", emoji: "🛍️" },
  servicos:         { pt: "Serviços",           color: "#8b5cf6", emoji: "⚙️" },
  moradia:          { pt: "Moradia",            color: "#14b8a6", emoji: "🏠" },
  educacao:         { pt: "Educação",           color: "#0ea5e9", emoji: "📚" },
  receitas:         { pt: "Receitas",           color: "#10b981", emoji: "💰" },
  transferencias:   { pt: "Transferências",     color: "#06b6d4", emoji: "↔️" },
  investimentos:    { pt: "Investimentos",      color: "#f59e0b", emoji: "📈" },
  impostos:         { pt: "Impostos e Taxas",   color: "#dc2626", emoji: "🏛️" },
  outros:           { pt: "Outros",             color: "#6b7280", emoji: "📦" },
};

// All Pluggy categories mapped to a group + Portuguese name
// Keys = Pluggy category strings (exact match first)
export const CATEGORY_MAP: Record<string, CategoryDef> = {
  // ── Alimentação ──────────────────────────────
  "Food":               { pt: "Alimentação geral",  color: "#f97316", emoji: "🍔", parent: "alimentacao" },
  "Food and Drink":     { pt: "Alimentação geral",  color: "#f97316", emoji: "🍔", parent: "alimentacao" },
  "Eating out":         { pt: "Restaurantes",        color: "#fb923c", emoji: "🍽️", parent: "alimentacao" },
  "Restaurants":        { pt: "Restaurantes",        color: "#fb923c", emoji: "🍽️", parent: "alimentacao" },
  "Supermarkets":       { pt: "Supermercado",        color: "#84cc16", emoji: "🛒", parent: "alimentacao" },
  "Groceries":          { pt: "Mercado",             color: "#84cc16", emoji: "🛒", parent: "alimentacao" },
  "Bakery":             { pt: "Padaria",             color: "#f59e0b", emoji: "🥖", parent: "alimentacao" },
  "Coffee":             { pt: "Cafeteria",           color: "#a16207", emoji: "☕", parent: "alimentacao" },
  "Fast food":          { pt: "Fast food",           color: "#ef4444", emoji: "🍟", parent: "alimentacao" },
  "Delivery":           { pt: "Delivery",            color: "#f97316", emoji: "🛵", parent: "alimentacao" },

  // ── Transporte ───────────────────────────────
  "Transport":          { pt: "Transporte geral",    color: "#3b82f6", emoji: "🚗", parent: "transporte" },
  "Transportation":     { pt: "Transporte geral",    color: "#3b82f6", emoji: "🚗", parent: "transporte" },
  "Public Transport":   { pt: "Transporte público",  color: "#60a5fa", emoji: "🚇", parent: "transporte" },
  "Uber":               { pt: "Uber / App",          color: "#2563eb", emoji: "🚕", parent: "transporte" },
  "Taxi":               { pt: "Táxi",                color: "#2563eb", emoji: "🚕", parent: "transporte" },
  "Fuel":               { pt: "Combustível",         color: "#1d4ed8", emoji: "⛽", parent: "transporte" },
  "Parking":            { pt: "Estacionamento",      color: "#1e40af", emoji: "🅿️", parent: "transporte" },
  "Toll":               { pt: "Pedágio",             color: "#1e3a8a", emoji: "🛣️", parent: "transporte" },
  "Car maintenance":    { pt: "Manutenção do carro", color: "#1e3a8a", emoji: "🔧", parent: "transporte" },

  // ── Saúde ────────────────────────────────────
  "Health":             { pt: "Saúde geral",         color: "#ec4899", emoji: "🏥", parent: "saude" },
  "Healthcare":         { pt: "Saúde geral",         color: "#ec4899", emoji: "🏥", parent: "saude" },
  "Pharmacy":           { pt: "Farmácia",            color: "#f472b6", emoji: "💊", parent: "saude" },
  "Gym":                { pt: "Academia",            color: "#db2777", emoji: "🏋️", parent: "saude" },
  "Doctor":             { pt: "Médico",              color: "#be185d", emoji: "👨‍⚕️", parent: "saude" },
  "Dentist":            { pt: "Dentista",            color: "#9d174d", emoji: "🦷", parent: "saude" },
  "Optical":            { pt: "Ótica",               color: "#831843", emoji: "👓", parent: "saude" },

  // ── Lazer ────────────────────────────────────
  "Entertainment":      { pt: "Entretenimento",      color: "#a855f7", emoji: "🎬", parent: "lazer" },
  "Leisure":            { pt: "Lazer geral",         color: "#9333ea", emoji: "🎮", parent: "lazer" },
  "Gaming":             { pt: "Jogos",               color: "#7e22ce", emoji: "🕹️", parent: "lazer" },
  "Cinema":             { pt: "Cinema",              color: "#7e22ce", emoji: "🎬", parent: "lazer" },
  "Music":              { pt: "Música",              color: "#6d28d9", emoji: "🎵", parent: "lazer" },
  "Sports":             { pt: "Esportes",            color: "#5b21b6", emoji: "⚽", parent: "lazer" },
  "Travel":             { pt: "Viagem",              color: "#c026d3", emoji: "✈️", parent: "lazer" },
  "Hotel":              { pt: "Hotel",               color: "#a21caf", emoji: "🏨", parent: "lazer" },
  "Tourism":            { pt: "Turismo",             color: "#86198f", emoji: "🗺️", parent: "lazer" },

  // ── Compras ──────────────────────────────────
  "Shopping":           { pt: "Compras geral",       color: "#e879f9", emoji: "🛍️", parent: "compras" },
  "Clothing":           { pt: "Roupas",              color: "#d946ef", emoji: "👕", parent: "compras" },
  "Electronics":        { pt: "Eletrônicos",         color: "#c026d3", emoji: "📱", parent: "compras" },
  "Books":              { pt: "Livros",              color: "#a21caf", emoji: "📚", parent: "compras" },
  "Home":               { pt: "Casa / Decoração",    color: "#86198f", emoji: "🏡", parent: "compras" },
  "Pets":               { pt: "Pets",                color: "#701a75", emoji: "🐾", parent: "compras" },
  "Beauty":             { pt: "Beleza",              color: "#f0abfc", emoji: "💄", parent: "compras" },
  "Personal care":      { pt: "Cuidados pessoais",   color: "#f0abfc", emoji: "🪥", parent: "compras" },
  "Perfumery":          { pt: "Perfumaria",          color: "#f0abfc", emoji: "🧴", parent: "compras" },

  // ── Serviços e assinaturas ───────────────────
  "Services":           { pt: "Serviços geral",      color: "#8b5cf6", emoji: "⚙️", parent: "servicos" },
  "Online Services":    { pt: "Serviços online",     color: "#7c3aed", emoji: "💻", parent: "servicos" },
  "Streaming":          { pt: "Streaming",           color: "#6d28d9", emoji: "📺", parent: "servicos" },
  "Subscriptions":      { pt: "Assinaturas",         color: "#5b21b6", emoji: "🔔", parent: "servicos" },
  "Telecommunications": { pt: "Telecomunicações",    color: "#4c1d95", emoji: "📡", parent: "servicos" },
  "Internet":           { pt: "Internet",            color: "#4c1d95", emoji: "🌐", parent: "servicos" },
  "Phone":              { pt: "Telefone",            color: "#5b21b6", emoji: "📞", parent: "servicos" },

  // ── Moradia ──────────────────────────────────
  "Housing":            { pt: "Moradia geral",       color: "#14b8a6", emoji: "🏠", parent: "moradia" },
  "Rent":               { pt: "Aluguel",             color: "#0d9488", emoji: "🏠", parent: "moradia" },
  "Utilities":          { pt: "Contas de casa",      color: "#0891b2", emoji: "💡", parent: "moradia" },
  "Electricity":        { pt: "Luz / Energia",       color: "#ca8a04", emoji: "💡", parent: "moradia" },
  "Water":              { pt: "Água",                color: "#0284c7", emoji: "💧", parent: "moradia" },
  "Gas":                { pt: "Gás",                 color: "#dc2626", emoji: "🔥", parent: "moradia" },
  "Condominium":        { pt: "Condomínio",          color: "#0f766e", emoji: "🏢", parent: "moradia" },

  // ── Educação ─────────────────────────────────
  "Education":          { pt: "Educação geral",      color: "#0ea5e9", emoji: "📚", parent: "educacao" },
  "School":             { pt: "Escola",              color: "#0284c7", emoji: "🏫", parent: "educacao" },
  "Course":             { pt: "Curso",               color: "#0369a1", emoji: "🎓", parent: "educacao" },

  // ── Receitas ─────────────────────────────────
  "Salary":             { pt: "Salário",             color: "#10b981", emoji: "💰", parent: "receitas" },
  "Income":             { pt: "Receita geral",       color: "#10b981", emoji: "💰", parent: "receitas" },
  "Freelance":          { pt: "Freelance",           color: "#059669", emoji: "💻", parent: "receitas" },
  "Bonus":              { pt: "Bônus",               color: "#047857", emoji: "🎁", parent: "receitas" },
  "Refund":             { pt: "Reembolso",           color: "#065f46", emoji: "↩️", parent: "receitas" },

  // ── Transferências ───────────────────────────
  "Transfer":               { pt: "Transferência",       color: "#6b7280", emoji: "↔️", parent: "transferencias" },
  "Transfers":              { pt: "Transferência",       color: "#6b7280", emoji: "↔️", parent: "transferencias" },
  "Transfer - PIX":         { pt: "PIX",                 color: "#06b6d4", emoji: "⚡", parent: "transferencias" },
  "PIX":                    { pt: "PIX",                 color: "#06b6d4", emoji: "⚡", parent: "transferencias" },
  "Pix":                    { pt: "PIX",                 color: "#06b6d4", emoji: "⚡", parent: "transferencias" },
  "Same person transfer":   { pt: "Transferência própria", color: "#64748b", emoji: "🔄", parent: "transferencias" },
  "TED":                    { pt: "TED",                 color: "#0891b2", emoji: "🏦", parent: "transferencias" },
  "DOC":                    { pt: "DOC",                 color: "#0e7490", emoji: "🏦", parent: "transferencias" },

  // ── Investimentos ────────────────────────────
  "Investment":         { pt: "Investimento geral",  color: "#f59e0b", emoji: "📈", parent: "investimentos" },
  "Investments":        { pt: "Investimento geral",  color: "#f59e0b", emoji: "📈", parent: "investimentos" },
  "CDB":                { pt: "CDB / Renda Fixa",    color: "#d97706", emoji: "📈", parent: "investimentos" },
  "Stocks":             { pt: "Ações",               color: "#b45309", emoji: "📊", parent: "investimentos" },
  "Crypto":             { pt: "Criptomoedas",        color: "#92400e", emoji: "₿",  parent: "investimentos" },

  // ── Impostos e Taxas ─────────────────────────
  "Taxes":              { pt: "Impostos",            color: "#dc2626", emoji: "🏛️", parent: "impostos" },
  "Bank fees":          { pt: "Tarifas bancárias",   color: "#b91c1c", emoji: "🏦", parent: "impostos" },
  "Credit card":        { pt: "Fatura cartão",       color: "#991b1b", emoji: "💳", parent: "impostos" },
  "Loan":               { pt: "Empréstimo",          color: "#7f1d1d", emoji: "🏦", parent: "impostos" },
  "Insurance":          { pt: "Seguro",              color: "#b91c1c", emoji: "🛡️", parent: "impostos" },

  // ── Impostos e Taxas (extra) ─────────────────
  "Tax on financial operations": { pt: "Tarifa / IOF",        color: "#b91c1c", emoji: "🏛️", parent: "impostos" },
  "Tax on Financial Operations": { pt: "Tarifa / IOF",        color: "#b91c1c", emoji: "🏛️", parent: "impostos" },
  "Credit card payment":         { pt: "Fatura cartão",       color: "#991b1b", emoji: "💳", parent: "impostos" },
  "Credit Card":          { pt: "Fatura cartão",       color: "#991b1b", emoji: "💳", parent: "impostos" },
  "Debt":                 { pt: "Dívida / Empréstimo", color: "#7f1d1d", emoji: "🏦", parent: "impostos" },
  "Bill payment":         { pt: "Pagamento de conta",  color: "#dc2626", emoji: "📄", parent: "impostos" },
  "Bill Payment":         { pt: "Pagamento de conta",  color: "#dc2626", emoji: "📄", parent: "impostos" },

  // ── Transferências (extra) ───────────────────
  "Third party transfer - Debit Card": { pt: "Débito no cartão",      color: "#475569", emoji: "💳", parent: "transferencias" },
  "Third party transfer - Credit Card":{ pt: "Crédito no cartão",     color: "#475569", emoji: "💳", parent: "transferencias" },
  "Third party transfer":              { pt: "Transferência terceiro", color: "#64748b", emoji: "↔️", parent: "transferencias" },
  "Internal transfer":                 { pt: "Transferência interna",  color: "#64748b", emoji: "🔄", parent: "transferencias" },
  "Internal Transfer":    { pt: "Transferência interna", color: "#64748b", emoji: "🔄", parent: "transferencias" },
  "Wire transfer":        { pt: "Transferência",         color: "#6b7280", emoji: "↔️", parent: "transferencias" },

  // ── Receitas (extra) ─────────────────────────
  "Cashback":                          { pt: "Cashback",              color: "#10b981", emoji: "💸", parent: "receitas" },
  "Interest":                          { pt: "Rendimento",            color: "#059669", emoji: "💹", parent: "receitas" },
  "Dividend":                          { pt: "Dividendos",            color: "#047857", emoji: "📊", parent: "receitas" },
  "Proceeds interests and dividends":  { pt: "Rendimento / Juros",    color: "#059669", emoji: "💹", parent: "receitas" },
  "Proceeds Interests and Dividends":  { pt: "Rendimento / Juros",    color: "#059669", emoji: "💹", parent: "receitas" },
  "Digital services":                  { pt: "Serviços digitais",     color: "#6d28d9", emoji: "💻", parent: "servicos" },
  "Digital Services":                  { pt: "Serviços digitais",     color: "#6d28d9", emoji: "💻", parent: "servicos" },
  "Withdrawal":                        { pt: "Saque",                 color: "#6b7280", emoji: "🏧", parent: "transferencias" },
  "Deposit":                           { pt: "Depósito",              color: "#10b981", emoji: "🏦", parent: "receitas" },

  // ── Outros ───────────────────────────────────
  "Other":              { pt: "Outros",              color: "#6b7280", emoji: "📦", parent: "outros" },
  "Others":             { pt: "Outros",              color: "#6b7280", emoji: "📦", parent: "outros" },
  "Uncategorized":      { pt: "Sem categoria",       color: "#6b7280", emoji: "📦", parent: "outros" },
};

// Partial match fallback
const PARTIAL_MATCH: Array<{ keywords: string[]; result: CategoryDef }> = [
  { keywords: ["pix", "transferência", "transfer"], result: { pt: "PIX / Transferência", color: "#06b6d4", emoji: "⚡", parent: "transferencias" } },
  { keywords: ["uber", "99 ", "cabify"], result: { pt: "Uber / App", color: "#2563eb", emoji: "🚕", parent: "transporte" } },
  { keywords: ["autopass", "bilhete", "metrô", "metro", "ônibus", "onibus", "bus "], result: { pt: "Transporte público", color: "#60a5fa", emoji: "🚇", parent: "transporte" } },
  { keywords: ["ifood", "rappi", "delivery"], result: { pt: "Delivery", color: "#f97316", emoji: "🛵", parent: "alimentacao" } },
  { keywords: ["netflix", "spotify", "prime", "disney", "hbo", "youtube"], result: { pt: "Streaming", color: "#6d28d9", emoji: "📺", parent: "servicos" } },
  { keywords: ["mercado", "supermercado", "atacado", "feira"], result: { pt: "Supermercado", color: "#84cc16", emoji: "🛒", parent: "alimentacao" } },
  { keywords: ["farmácia", "farmacia", "drogaria", "droga"], result: { pt: "Farmácia", color: "#f472b6", emoji: "💊", parent: "saude" } },
  { keywords: ["burger", "pizza", "sushi", "restaurante", "lanchonete"], result: { pt: "Restaurantes", color: "#fb923c", emoji: "🍽️", parent: "alimentacao" } },
  { keywords: ["porquinho", "cdb", "tesouro", "investimento", "resgate", "aplicacao", "aplicação"], result: { pt: "Investimento", color: "#f59e0b", emoji: "📈", parent: "investimentos" } },
  { keywords: ["telecom", "claro", "vivo", "tim ", "oi ", "net ", "internet"], result: { pt: "Telecomunicações", color: "#4c1d95", emoji: "📡", parent: "servicos" } },
  { keywords: ["academia", "smartfit", "bodytech"], result: { pt: "Academia", color: "#db2777", emoji: "🏋️", parent: "saude" } },
  { keywords: ["salário", "salario", "pagamento", "holerite"], result: { pt: "Salário", color: "#10b981", emoji: "💰", parent: "receitas" } },
  { keywords: ["same person"], result: { pt: "Transferência própria", color: "#64748b", emoji: "🔄", parent: "transferencias" } },
  { keywords: ["seguro"], result: { pt: "Seguro", color: "#b91c1c", emoji: "🛡️", parent: "impostos" } },
  { keywords: ["credit card", "fatura", "cartão", "cartao"], result: { pt: "Fatura cartão", color: "#991b1b", emoji: "💳", parent: "impostos" } },
  { keywords: ["cashback", "reembolso", "estorno"], result: { pt: "Cashback / Reembolso", color: "#10b981", emoji: "💸", parent: "receitas" } },
  { keywords: ["iof", "tarifa", "taxa", "imposto"], result: { pt: "Tarifa / IOF", color: "#b91c1c", emoji: "🏛️", parent: "impostos" } },
  { keywords: ["rendimento", "remuneracao", "remuneração", "juros"], result: { pt: "Rendimento", color: "#059669", emoji: "💹", parent: "receitas" } },
  { keywords: ["spotify", "netflix", "youtube", "digital", "assinatura"], result: { pt: "Serviços digitais", color: "#6d28d9", emoji: "💻", parent: "servicos" } },
  { keywords: ["débito", "debito", "electron", "visa electron"], result: { pt: "Débito no cartão", color: "#475569", emoji: "💳", parent: "transferencias" } },
  { keywords: ["saque", "withdraw", "atm"], result: { pt: "Saque", color: "#6b7280", emoji: "🏧", parent: "transferencias" } },
  { keywords: ["aluguel"], result: { pt: "Aluguel", color: "#0d9488", emoji: "🏠", parent: "moradia" } },
  { keywords: ["perfum", "cosmet", "beleza"], result: { pt: "Beleza", color: "#f0abfc", emoji: "💄", parent: "compras" } },
];

export function getCategoryInfo(category: string | null): {
  pt: string; color: string; emoji: string; parent?: string;
} {
  if (!category) return { pt: "Outros", color: "#6b7280", emoji: "📦", parent: "outros" };

  if (CATEGORY_MAP[category]) return CATEGORY_MAP[category];

  const lower = category.toLowerCase();
  const exactCI = Object.entries(CATEGORY_MAP).find(([k]) => k.toLowerCase() === lower);
  if (exactCI) return exactCI[1];

  for (const rule of PARTIAL_MATCH) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.result;
  }

  return { pt: category, color: "#6b7280", emoji: "📦", parent: "outros" };
}

// Returns all categories grouped by parent for use in selectors
export function getCategoriesGrouped(): Array<{
  groupKey: string;
  groupPt: string;
  groupEmoji: string;
  items: Array<{ key: string; pt: string; emoji: string; color: string }>;
}> {
  const groups: Record<string, { key: string; pt: string; emoji: string; color: string }[]> = {};

  // Deduplicate by pt name within each parent
  const seen: Record<string, Set<string>> = {};

  for (const [key, def] of Object.entries(CATEGORY_MAP)) {
    if (!groups[def.parent]) { groups[def.parent] = []; seen[def.parent] = new Set(); }
    if (!seen[def.parent].has(def.pt)) {
      seen[def.parent].add(def.pt);
      groups[def.parent].push({ key, pt: def.pt, emoji: def.emoji, color: def.color });
    }
  }

  return Object.entries(CATEGORY_GROUPS).map(([groupKey, group]) => ({
    groupKey,
    groupPt: group.pt,
    groupEmoji: group.emoji,
    items: groups[groupKey] ?? [],
  })).filter((g) => g.items.length > 0);
}

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function generateBudgetColors(): string[] {
  return ["#0ea5e9","#10b981","#f97316","#a855f7","#ec4899","#f59e0b","#3b82f6","#84cc16"];
}
