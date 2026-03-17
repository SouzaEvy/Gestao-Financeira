import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("custom_categories")
    .select("*")
    .eq("user_id", userId)
    .order("name_pt");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { name_pt, emoji, color } = await req.json();
  if (!name_pt) return NextResponse.json({ error: "name_pt obrigatório" }, { status: 400 });

  // Generate internal key from name
  const name = name_pt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const db = createAdminClient();
  const { data, error } = await db
    .from("custom_categories")
    .insert({ user_id: userId, name, name_pt, emoji: emoji || "📦", color: color || "#6b7280" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  const db = createAdminClient();

  const { error } = await db
    .from("custom_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
