// app/api/pluggy/[route]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  createConnectToken,
  getItem,
  getAccounts,
  getTransactions,
  getAllTransactions,
  deleteItem,
} from "@/lib/pluggy";
import { createAdminClient } from "@/lib/supabase";
import { getCategoryInfo } from "@/lib/utils";

type RouteParams = { params: Promise<{ route: string }> };

// ─────────────────────────────────────────────
// Ensure user exists in Supabase users table
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureUser(userId: string, db: any) {
  // Get Clerk user details
  const clerkUser = await currentUser();

  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown.com`;
  const full_name =
    clerkUser?.fullName ??
    `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
    null;
  const avatar_url = clerkUser?.imageUrl ?? null;

  // Upsert — safe to call on every request
  const { error } = await db.from("users").upsert(
    { id: userId, email, full_name, avatar_url },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[ensureUser] Failed to upsert user:", error);
  }
}

// ─────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { route } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    switch (route) {
      // ── /api/pluggy/connect-token ──────────────
      case "connect-token": {
        const body = await req.json().catch(() => ({}));
        const token = await createConnectToken(body?.itemId);
        const accessToken =
          token.accessToken ??
          (token as unknown as { apiKey?: string }).apiKey;
        return NextResponse.json({ accessToken });
      }

      // ── /api/pluggy/connect ────────────────────
      case "connect": {
        const { itemId, connectorName, logoUrl } = await req.json();

        if (!itemId || !connectorName) {
          return NextResponse.json(
            { error: "itemId e connectorName são obrigatórios" },
            { status: 400 }
          );
        }

        const db = createAdminClient();

        // ✅ Create user in Supabase if not exists
        await ensureUser(userId, db);

        // Get item details from Pluggy
        const item = await getItem(itemId);

        // Upsert connected_accounts
        const { data: account, error: accountErr } = await db
          .from("connected_accounts")
          .upsert(
            {
              user_id: userId,
              item_id: itemId,
              connector_id: item.connector.id,
              name: connectorName,
              logo_url: logoUrl ?? item.connector.imageUrl ?? null,
              status: "updating",
              last_synced_at: null,
            },
            { onConflict: "user_id,item_id" }
          )
          .select()
          .single();

        if (accountErr) throw accountErr;

        // Trigger initial sync in background
        syncItemInBackground(userId, itemId, db).catch(console.error);

        return NextResponse.json({ success: true, account });
      }

      // ── /api/pluggy/sync ───────────────────────
      case "sync": {
        const { itemId } = await req.json();
        if (!itemId) {
          return NextResponse.json(
            { error: "itemId é obrigatório" },
            { status: 400 }
          );
        }

        const db = createAdminClient();

        await ensureUser(userId, db);

        const { data: account } = await db
          .from("connected_accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("item_id", itemId)
          .single();

        if (!account) {
          return NextResponse.json(
            { error: "Conta não encontrada" },
            { status: 404 }
          );
        }

        await syncItemInBackground(userId, itemId, db);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Rota não encontrada" },
          { status: 404 }
        );
    }
  } catch (err) {
    console.error(`[pluggy/${route}] Error:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// DELETE /api/pluggy/disconnect
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { route } = await params;
  if (route !== "disconnect") {
    return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { itemId, accountId } = await req.json();
    const db = createAdminClient();

    const { data: account } = await db
      .from("connected_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    await deleteItem(itemId).catch(() => {
      console.warn(`Could not delete Pluggy item ${itemId}, continuing...`);
    });

    await db.from("connected_accounts").delete().eq("id", accountId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pluggy/disconnect] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// Core sync logic
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncItemInBackground(userId: string, itemId: string, db: any) {
  try {
    await db
      .from("connected_accounts")
      .update({ status: "updating" })
      .eq("user_id", userId)
      .eq("item_id", itemId);

    const accounts = await getAccounts(itemId);

    // Load deleted pluggy_ids to skip during sync
    const { data: deletedRows } = await db
      .from("deleted_transactions")
      .select("pluggy_id")
      .eq("user_id", userId);
    const deletedIds = new Set((deletedRows ?? []).map((r: { pluggy_id: string }) => r.pluggy_id));

    for (const account of accounts) {
      // Fetch ALL transactions (all pages, no date filter)
      const transactions = await getAllTransactions(account.id);

      if (transactions.length === 0) continue;

      // Skip manually deleted transactions
      // Also skip credit card bill payments from checking account
      // (the individual purchases are imported separately from the card account)
      const BILL_PAYMENT_PATTERNS = [
        /PAGAMENTO DE FATURA/i,
        /PAGAMENTO CARTAO/i,
        /PAGTO CARTAO/i,
        /PAGTO FATURA/i,
        /PAYMENT CREDIT CARD/i,
        /BILL PAYMENT/i,
        /FATURA CARTAO/i,
        /FATURA CREDITO/i,
      ];

      const isBillPayment = (tx: { description: string; category: string | null }) => {
        if (tx.category === "Credit card payment" || tx.category === "Credit card") return true;
        return BILL_PAYMENT_PATTERNS.some((p) => p.test(tx.description));
      };

      const filtered = transactions.filter((tx) =>
        !deletedIds.has(tx.id) && !isBillPayment(tx)
      );

      // Dedup: skip transactions with same date + amount + type
      // that already exist in DB (avoids double-import of card payment)
      const { data: existingTx } = await db
        .from("transactions")
        .select("date, amount, type, pluggy_id")
        .eq("user_id", userId)
        .eq("account_id", account.id);

      // Build a signature set of existing transactions
      // signature = "date|amount|type"
      const existingSigs = new Set(
        (existingTx ?? []).map((t: { date: string; amount: number; type: string; pluggy_id: string }) =>
          `${t.date}|${Math.abs(t.amount)}|${t.type}`
        )
      );

      const rows: Record<string, unknown>[] = [];
      const newSigs = new Set<string>();

      for (const tx of filtered) {
        const amount = tx.type === "CREDIT" ? tx.amount : -Math.abs(tx.amount);
        const date = tx.date.split("T")[0];
        const sig = `${date}|${Math.abs(amount)}|${tx.type.toLowerCase()}`;

        // Skip if exact duplicate already in DB (different pluggy_id, same date/amount/type)
        // BUT always allow if this pluggy_id already exists (it's an update)
        const alreadyInDb = existingTx?.find(
          (t: { pluggy_id: string }) => t.pluggy_id === tx.id
        );

        if (!alreadyInDb && existingSigs.has(sig) && newSigs.has(sig)) {
          // True duplicate — skip
          console.log(`[sync] Skipping duplicate: ${tx.description} ${sig}`);
          continue;
        }

        newSigs.add(sig);
        const catInfo = getCategoryInfo(tx.category);
        rows.push({
          user_id: userId,
          account_id: account.id,
          item_id: itemId,
          pluggy_id: tx.id,
          date,
          description: tx.description,
          amount,
          type: tx.type.toLowerCase(),
          category: tx.category,
          category_pt: catInfo.pt,
          balance: tx.balance,
          is_credit_card: account.type === "CREDIT",
        });
      }

      if (rows.length === 0) continue;

      await db
        .from("transactions")
        .upsert(rows, {
          onConflict: "user_id,pluggy_id",
          ignoreDuplicates: false,
        });
    }

    await db
      .from("connected_accounts")
      .update({ status: "updated", last_synced_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("item_id", itemId);
  } catch (err) {
    console.error("[syncItemInBackground] Error:", err);
    await db
      .from("connected_accounts")
      .update({ status: "outdated" })
      .eq("user_id", userId)
      .eq("item_id", itemId);
    throw err;
  }
}
