// lib/pluggy.ts — Server-side only

const PLUGGY_API = "https://api.pluggy.ai";

interface PluggyTokenResponse {
  apiKey: string;
}

let cachedToken: { key: string; expiresAt: number } | null = null;

async function getPluggyApiKey(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.key;
  }

  const res = await fetch(`${PLUGGY_API}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`Pluggy auth failed: ${await res.text()}`);

  const data: PluggyTokenResponse = await res.json();
  cachedToken = { key: data.apiKey, expiresAt: Date.now() + 115 * 60 * 1000 };
  return data.apiKey;
}

async function pluggyFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const apiKey = await getPluggyApiKey();
  const res = await fetch(`${PLUGGY_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Pluggy API error [${res.status}] ${path}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function createConnectToken(itemId?: string): Promise<{ accessToken: string }> {
  const body: Record<string, unknown> = {};
  if (itemId) body.itemId = itemId;
  return pluggyFetch<{ accessToken: string }>("/connect_token", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getItem(itemId: string) {
  return pluggyFetch<{
    id: string;
    connector: { id: number; name: string; imageUrl: string };
    status: string;
    executionStatus: string;
    createdAt: string;
    updatedAt: string;
    lastUpdatedAt: string | null;
  }>(`/items/${itemId}`);
}

export async function getAccounts(itemId: string) {
  const res = await pluggyFetch<{
    total: number;
    results: Array<{
      id: string;
      itemId: string;
      name: string;
      type: string;
      subtype: string;
      number: string;
      balance: number;
      currencyCode: string;
    }>;
  }>(`/accounts?itemId=${itemId}`);
  return res.results;
}

interface PluggyTransactionResult {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  balance: number | null;
  category: string | null;
  type: "CREDIT" | "DEBIT";
  status: string;
}

interface PluggyTransactionPage {
  total: number;
  totalPages: number;
  page: number;
  results: PluggyTransactionResult[];
}

// Fetch ALL pages of transactions for an account
export async function getAllTransactions(
  accountId: string,
  options?: { from?: string; to?: string }
): Promise<PluggyTransactionResult[]> {
  const all: PluggyTransactionResult[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({ accountId, pageSize: "500", page: String(page) });
    if (options?.from) params.set("from", options.from);
    if (options?.to) params.set("to", options.to);

    const res = await pluggyFetch<PluggyTransactionPage>(`/transactions?${params.toString()}`);
    all.push(...res.results);
    totalPages = res.totalPages;
    page++;
  } while (page <= totalPages);

  return all;
}

// Keep single-page version for backwards compat
export async function getTransactions(
  accountId: string,
  options?: { from?: string; to?: string; page?: number; pageSize?: number }
): Promise<PluggyTransactionResult[]> {
  const params = new URLSearchParams({ accountId });
  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);
  if (options?.page) params.set("page", String(options.page));
  params.set("pageSize", String(options?.pageSize ?? 100));

  const res = await pluggyFetch<PluggyTransactionPage>(`/transactions?${params.toString()}`);
  return res.results;
}

export async function deleteItem(itemId: string): Promise<void> {
  await pluggyFetch(`/items/${itemId}`, { method: "DELETE" });
}
