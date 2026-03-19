// app/api/webhooks/pluggy/route.ts
// Receives Pluggy webhook events when new transactions arrive
// Setup: Pluggy Dashboard → Webhooks → Add endpoint
// URL: https://yourdomain.com/api/webhooks/pluggy
// Events: item/updated, transactions/updated

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAccounts, getAllTransactions } from "@/lib/pluggy";
import { getCategoryInfo } from "@/lib/utils";

interface PluggyWebhookPayload {
  event: string;
  data: {
    itemId?: string;
    item?: { id: string };
  };
}

// Verify webhook secret from Pluggy
function verifyPluggyWebhook(req: NextRequest): boolean {
  const secret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if not configured

  const signature = req.headers.get("x-pluggy-signature");
  return signature === secret;
}

export async function POST(req: NextRequest) {
  if (!verifyPluggyWebhook(req)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PluggyWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = payload;
  const itemId = data.itemId ?? data.item?.id;

  console.log(`[pluggy-webhook] Event: ${event}, itemId: ${itemId}`);

  if (!itemId) {
    return NextResponse.json({ error: "No itemId" }, { status: 400 });
  }

  // Only process transaction update events
  if (!["item/updated", "transactions/updated", "item/login_succeeded"].includes(event)) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const db = createAdminClient();

  // Find the user that owns this item
  const { data: account } = await db
    .from("connected_accounts")
    .select("user_id, item_id")
    .eq("item_id", itemId)
    .single();

  if (!account) {
    console.error(`[pluggy-webhook] No account found for item ${itemId}`);
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const userId = account.user_id;

  try {
    // Mark as updating
    await db
      .from("connected_accounts")
      .update({ status: "updating" })
      .eq("item_id", itemId);

    // Load deleted transaction ids to skip
    const { data: deletedRows } = await db
      .from("deleted_transactions")
      .select("pluggy_id")
      .eq("user_id", userId);
    const deletedIds = new Set((deletedRows ?? []).map((r: { pluggy_id: string }) => r.pluggy_id));

    // Fetch and sync all accounts
    const accounts = await getAccounts(itemId);
    let totalNew = 0;

    for (const acc of accounts) {
      const transactions = await getAllTransactions(acc.id);

      const BILL_PAYMENT_PATTERNS = [
        /PAGAMENTO DE FATURA/i,
        /PAGAMENTO CARTAO/i,
        /PAGTO CARTAO/i,
        /PAGTO FATURA/i,
        /PAYMENT CREDIT CARD/i,
        /FATURA CARTAO/i,
      ];

      const rows = transactions
        .filter((tx) => !deletedIds.has(tx.id))
        .filter((tx) => !BILL_PAYMENT_PATTERNS.some((p) => p.test(tx.description)))
        .map((tx) => {
          const catInfo = getCategoryInfo(tx.category);
          const amount = tx.type === "CREDIT" ? tx.amount : -Math.abs(tx.amount);
          return {
            user_id: userId,
            account_id: acc.id,
            item_id: itemId,
            pluggy_id: tx.id,
            date: tx.date.split("T")[0],
            description: tx.description,
            amount,
            type: tx.type.toLowerCase(),
            category: tx.category,
            category_pt: catInfo.pt,
            balance: tx.balance,
            is_credit_card: acc.type === "CREDIT",
          };
        });

      if (rows.length > 0) {
        await db.from("transactions").upsert(rows, {
          onConflict: "user_id,pluggy_id",
          ignoreDuplicates: false,
        });
        totalNew += rows.length;
      }
    }

    // Mark as updated
    await db
      .from("connected_accounts")
      .update({ status: "updated", last_synced_at: new Date().toISOString() })
      .eq("item_id", itemId);

    console.log(`[pluggy-webhook] Synced ${totalNew} transactions for user ${userId}`);
    return NextResponse.json({ success: true, synced: totalNew });
  } catch (err) {
    console.error(`[pluggy-webhook] Error:`, err);
    await db.from("connected_accounts").update({ status: "outdated" }).eq("item_id", itemId);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
