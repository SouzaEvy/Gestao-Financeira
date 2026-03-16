// ─────────────────────────────────────────────
// Database types (mirrors Supabase schema)
// ─────────────────────────────────────────────

export interface DbUser {
  id: string; // Clerk userId
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  item_id: string; // Pluggy itemId
  connector_id: number;
  name: string; // e.g. "Nubank"
  logo_url: string | null;
  status: "updated" | "updating" | "login_error" | "outdated";
  last_synced_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string; // Pluggy accountId
  item_id: string;
  pluggy_id: string; // Pluggy transaction id
  date: string; // ISO
  description: string;
  amount: number; // positive = credit, negative = debit
  type: "credit" | "debit";
  category: string | null;
  category_pt: string | null; // Portuguese name
  balance: number | null;
  ignored: boolean;
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

// ─────────────────────────────────────────────
// Pluggy API types
// ─────────────────────────────────────────────

export interface PluggyConnector {
  id: number;
  name: string;
  institutionUrl: string;
  imageUrl: string;
  primaryColor: string;
  country: string;
}

export interface PluggyAccount {
  id: string;
  itemId: string;
  name: string;
  type: "BANK" | "CREDIT" | "INVESTMENT";
  subtype: string;
  number: string;
  balance: number;
  currencyCode: string;
  marketingName: string | null;
  owner: string | null;
}

export interface PluggyTransaction {
  id: string;
  accountId: string;
  description: string;
  descriptionRaw: string | null;
  currencyCode: string;
  amount: number;
  amountInAccountCurrency: number;
  date: string;
  balance: number | null;
  category: string | null;
  type: "CREDIT" | "DEBIT";
  status: "POSTED" | "PENDING";
  paymentData: {
    payer?: { name?: string; documentNumber?: { value: string; type: string } };
    receiver?: { name?: string };
    paymentMethod?: string;
    referenceNumber?: string;
  } | null;
}

export interface PluggyItem {
  id: string;
  connector: PluggyConnector;
  status: string;
  executionStatus: string;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string | null;
}

// ─────────────────────────────────────────────
// Dashboard aggregation types
// ─────────────────────────────────────────────

export interface DashboardSummary {
  totalBalance: number;
  monthlyExpenses: number;
  monthlySavings: number;
  budgetUsagePercent: number;
  balanceChange: number; // today's variation
}

export interface CategoryExpense {
  category: string;
  category_pt: string;
  amount: number;
  count: number;
  color: string;
}

export interface MonthlyChartData {
  month: string;    // display label e.g. "mar/26"
  monthKey?: string; // "yyyy-MM" for filtering e.g. "2026-03"
  receitas: number;
  despesas: number;
  economia: number;
}

// ─────────────────────────────────────────────
// Form types
// ─────────────────────────────────────────────

export interface BudgetFormValues {
  category: string;
  category_pt: string;
  monthly_limit: number;
  color: string;
}
