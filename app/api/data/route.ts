import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const noDateFilter = searchParams.get("noDateFilter") === "true";

  if (!table) {
    return NextResponse.json({ error: "table é obrigatório" }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    let query = db.from(table).select("*").eq("user_id", userId);

    // Only apply date filters when explicitly provided AND not bypassed
    if (!noDateFilter && from) query = query.gte("date", from);
    if (!noDateFilter && to) query = query.lte("date", to);

    if (table === "transactions") {
      query = query.order("date", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error(`[data/${table}] Error:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
