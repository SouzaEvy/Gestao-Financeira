import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const db = createAdminClient();

  const exists = await db.from("budgets").select("id").eq("user_id", userId).eq("category", body.category).single();
  if (exists.data) return NextResponse.json({ error: "Já existe um orçamento para essa categoria." }, { status: 400 });

  const { data, error } = await db.from("budgets").insert({ user_id: userId, ...body }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, ...body } = await req.json();
  const db = createAdminClient();

  const { data, error } = await db.from("budgets").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  const db = createAdminClient();

  const { error } = await db.from("budgets").delete().eq("id", id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
