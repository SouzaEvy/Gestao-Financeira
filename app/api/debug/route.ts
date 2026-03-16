import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const db = createAdminClient();

  const { data: transactions } = await db
    .from("transactions")
    .select("id, date, description, amount, type, category")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(20);

  const { data: accounts } = await db
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId);

  return NextResponse.json({
    userId,
    accountsCount: accounts?.length ?? 0,
    transactionsCount: transactions?.length ?? 0,
    transactions: transactions ?? [],
    today: new Date().toISOString(),
  });
}
