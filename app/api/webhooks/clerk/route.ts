// app/api/webhooks/clerk/route.ts
// Receives Clerk webhook events and syncs user data to Supabase
// Setup: Clerk Dashboard → Webhooks → Add endpoint
// URL: https://yourdomain.com/api/webhooks/clerk
// Events: user.created, user.updated, user.deleted

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// Verify the webhook is actually from Clerk
async function verifyClerkWebhook(req: NextRequest): Promise<{
  type: string;
  data: Record<string, unknown>;
} | null> {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return null;
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return null;
  }

  // Verify signature using Svix
  try {
    const { Webhook } = await import("svix");
    const wh = new Webhook(secret);
    const body = await req.text();
    const payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
    return payload;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const payload = await verifyClerkWebhook(req);

  if (!payload) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  const db = createAdminClient();
  const { type, data } = payload;

  console.log(`[clerk-webhook] Event: ${type}`);

  try {
    switch (type) {
      case "user.created":
      case "user.updated": {
        const userId = data.id as string;
        const emails = data.email_addresses as Array<{ email_address: string; id: string }>;
        const primaryEmailId = data.primary_email_address_id as string;
        const primaryEmail = emails?.find((e) => e.id === primaryEmailId)?.email_address
          ?? emails?.[0]?.email_address
          ?? `${userId}@unknown.com`;

        const firstName = (data.first_name as string) ?? "";
        const lastName = (data.last_name as string) ?? "";
        const fullName = `${firstName} ${lastName}`.trim() || null;
        const avatarUrl = (data.image_url as string) ?? null;

        const { error } = await db.from("users").upsert(
          {
            id: userId,
            email: primaryEmail,
            full_name: fullName,
            avatar_url: avatarUrl,
          },
          { onConflict: "id" }
        );

        if (error) throw error;
        console.log(`[clerk-webhook] User ${type === "user.created" ? "created" : "updated"}: ${userId}`);
        break;
      }

      case "user.deleted": {
        const userId = data.id as string;
        // Cascade delete — all user data is removed
        // (connected_accounts, transactions, budgets via FK or manual delete)
        await db.from("transactions").delete().eq("user_id", userId);
        await db.from("budgets").delete().eq("user_id", userId);
        await db.from("connected_accounts").delete().eq("user_id", userId);
        await db.from("deleted_transactions").delete().eq("user_id", userId);
        await db.from("users").delete().eq("id", userId);
        console.log(`[clerk-webhook] User deleted: ${userId}`);
        break;
      }

      default:
        console.log(`[clerk-webhook] Unhandled event: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[clerk-webhook] Error handling ${type}:`, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
