// ─────────────────────────────────────────────
// Database types
// ─────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  item_id: string;
  connector_id: number;
  name: string;
  logo_url: string | null;
  status: "updated" | "updating" | "login_error" | "outdated";
  last_synced_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  item_id: string;
  pluggy_id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";           // original from Pluggy
  custom_type: "credit" | "debit" | null; // user override
  category: string | null;            // original from Pluggy
  custom_category: string | null;     // user override
  category_pt: string | null;
  balance: number | null;
  ignored: boolean;
  is_credit_card: boolean;
  created_at: string;
}

// Computed helpers
export function resolvedType(tx: Transaction): "credit" | "debit" {
  if (tx.custom_type) return tx.custom_type;
  // Also infer from amount sign as fallback
  if (tx.amount > 0) return "credit";
  if (tx.amount < 0) return "debit";
  return tx.type;
}

export function resolvedCategory(tx: Transaction): string | null {
  return tx.custom_category ?? tx.category;
}

export interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  name_pt: string;
  emoji: string;
  color: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  category_pt: string;
  monthly_limit: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyExpenses: number;
  monthlySavings: number;
  budgetUsagePercent: number;
  balanceChange: number;
}

export interface MonthlyChartData {
  month: string;
  monthKey?: string;
  receitas: number;
  despesas: number;
  economia: number;
}

export interface BudgetFormValues {
  category: string;
  category_pt: string;
  monthly_limit: number;
  color: string;
}
