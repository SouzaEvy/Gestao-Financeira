import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

// PATCH — update ignored, custom_type, custom_category
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const allowed = ["ignored", "custom_type", "custom_category"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key];
  }

  const db = createAdminClient();
  const { error } = await db
    .from("transactions")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — remove transaction and record pluggy_id so sync never reimports it
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const db = createAdminClient();

  // 1. Fetch the pluggy_id before deleting
  const { data: tx, error: fetchErr } = await db
    .from("transactions")
    .select("pluggy_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !tx) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  // 2. Delete from transactions
  const { error: deleteErr } = await db
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  // 3. Record in deleted_transactions so sync skips it forever
  await db
    .from("deleted_transactions")
    .upsert(
      { user_id: userId, pluggy_id: tx.pluggy_id },
      { onConflict: "user_id,pluggy_id", ignoreDuplicates: true }
    );

  return NextResponse.json({ success: true });
}
