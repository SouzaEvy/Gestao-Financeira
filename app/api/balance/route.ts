import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";
import { getAccounts } from "@/lib/pluggy";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const db = createAdminClient();

  const { data: connected } = await db
    .from("connected_accounts")
    .select("item_id, name")
    .eq("user_id", userId);

  if (!connected || connected.length === 0) {
    return NextResponse.json({ totalBalance: 0, accounts: [], source: "no_accounts" });
  }

  let totalBalance = 0;
  const accounts: Array<{ name: string; balance: number; type: string }> = [];
  let pluggySuccess = false;

  for (const conn of connected) {
    try {
      const pluggyAccounts = await getAccounts(conn.item_id);
      console.log(`[balance] item ${conn.item_id} accounts:`, pluggyAccounts.map(a => ({ name: a.name, type: a.type, balance: a.balance })));

      for (const acc of pluggyAccounts) {
        // Only BANK accounts count towards total balance
        // CREDIT = cartão de crédito (quanto deve, não tem)
        // INVESTMENT = saldo investido (separado)
        if (acc.type === "BANK") {
          totalBalance += acc.balance;
        }
        accounts.push({
          name: acc.name || conn.name,
          balance: acc.balance,
          type: acc.type,
        });
        pluggySuccess = true;
      }
    } catch (err) {
      console.error(`[balance] Failed for item ${conn.item_id}:`, err);
    }
  }

  // Fallback: use last known balance from transactions table
  if (!pluggySuccess) {
    const { data: txs } = await db
      .from("transactions")
      .select("balance, account_id, date")
      .eq("user_id", userId)
      .not("balance", "is", null)
      .order("date", { ascending: false });

    const latestByAccount: Record<string, number> = {};
    (txs ?? []).forEach((t: { balance: number; account_id: string }) => {
      if (!(t.account_id in latestByAccount)) {
        latestByAccount[t.account_id] = t.balance;
      }
    });
    totalBalance = Object.values(latestByAccount).reduce((a, b) => a + b, 0);
    return NextResponse.json({ totalBalance, accounts, source: "transactions_fallback" });
  }

  return NextResponse.json({ totalBalance, accounts, source: "pluggy" });
}
