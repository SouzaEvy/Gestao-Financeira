# 💰 Finança — Personal Finance Starter

A production-ready personal finance web app with Open Finance (Brazil) integration.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Clerk · Supabase · Pluggy · Recharts · Framer Motion

---

## 📁 Project Structure

```
financeapp/
├── app/
│   ├── layout.tsx                    # Root layout (Clerk + dark theme)
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Dark theme CSS variables
│   ├── (app)/                        # Authenticated app shell
│   │   ├── layout.tsx                # Sidebar layout wrapper
│   │   ├── dashboard/page.tsx        # Main dashboard ⭐
│   │   ├── transactions/page.tsx     # Transactions + filters + CSV
│   │   ├── budgets/page.tsx          # Budget management
│   │   └── settings/page.tsx        # Connected accounts
│   └── api/
│       └── pluggy/[route]/route.ts   # connect-token · connect · sync · disconnect
├── components/
│   ├── ui/                           # All shadcn/ui components
│   ├── Sidebar.tsx                   # Collapsible sidebar nav
│   ├── Navbar.tsx                    # Top bar with sync button
│   ├── PluggyConnectButton.tsx       # Pluggy Connect widget 🔌
│   ├── DashboardCards.tsx            # 4 animated summary cards
│   ├── BalanceChart.tsx              # Recharts bar+line chart
│   ├── TransactionsTable.tsx         # Transactions list
│   ├── BudgetProgress.tsx            # Budget progress bars
│   └── theme-provider.tsx
├── lib/
│   ├── supabase.ts                   # Supabase client + admin client
│   ├── pluggy.ts                     # Pluggy API wrapper (server-only)
│   └── utils.ts                      # Formatters, category map, cn()
├── types/
│   └── index.ts                      # All TypeScript types
├── supabase/
│   └── schema.sql                    # DB schema + RLS policies ← run this first
├── middleware.ts                     # Clerk route protection
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
npx create-next-app@latest financeapp --empty
cd financeapp

# Copy all generated files into this folder, then:
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in all values (see setup guides below)
```

### 3. Set up the database

Go to **Supabase Dashboard → SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## 🔑 Service Setup Guides

### Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) → **Create application**
2. Enable **Google** and **Email magic link** sign-in methods
3. Go to **API Keys** → copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. In **Clerk Dashboard → Sessions → Customize session token**, no changes needed — we use `userId` directly.

> **Important:** Clerk does not integrate with Supabase Auth. Our app uses Clerk's `userId` as the primary key in Supabase tables, and the API routes use the Supabase service role key (which bypasses RLS) to write data on behalf of users. This is intentional and secure.

---

### Supabase (Database + Realtime)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Go to **Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor** → paste and run `supabase/schema.sql`
4. Go to **Database → Replication** → confirm `transactions` and `connected_accounts` are in the `supabase_realtime` publication

> **RLS Note:** The anon key is used client-side but RLS policies require `auth.uid()`. Since we use Clerk (not Supabase Auth), `auth.uid()` will be null for client requests. For production, you have two options:
> - **Option A (simpler):** Only use the Supabase client for reads; do all writes via API routes using the service role key.
> - **Option B (proper):** Issue Supabase JWTs from Clerk using a [Clerk + Supabase integration](https://clerk.com/docs/integrations/databases/supabase) (adds a Clerk JWT template).
> 
> The current setup uses **Option A** — all writes go through API routes which use `createAdminClient()`.

---

### Pluggy (Open Finance)

1. Go to [dashboard.pluggy.ai](https://dashboard.pluggy.ai) → sign up
2. Go to **API Keys** → copy:
   - `PLUGGY_CLIENT_ID`
   - `PLUGGY_CLIENT_SECRET`
3. In Pluggy dashboard, configure your **webhook URL** (optional but recommended):
   - `https://yourdomain.com/api/pluggy/webhook`
4. For **sandbox testing**, use connector ID `201` (Pluggy Bank — a fake bank for development)

> **Important:** Your Pluggy credentials are **server-side only**. They are never sent to the browser. The `PluggyConnectButton` fetches a short-lived `connectToken` from your API route (`/api/pluggy/connect-token`), which the widget uses client-side.

---

## 🏗️ How the Pluggy Integration Works

```
User clicks "Conectar conta"
        ↓
PluggyConnectButton
        ↓
POST /api/pluggy/connect-token     ← server mints a short-lived token
        ↓
Pluggy Connect Widget opens        ← user authenticates with their bank
        ↓
onSuccess({ item })
        ↓
POST /api/pluggy/connect           ← saves itemId to Supabase + triggers sync
        ↓
syncItemInBackground()
  → getAccounts(itemId)            ← fetches accounts from Pluggy API
  → getTransactions(accountId)     ← fetches transactions
  → upsert into transactions table ← deduped by pluggy_id
        ↓
Dashboard updates via Supabase Realtime ✓
```

---

## 📊 shadcn/ui Components Used

| Component | File |
|-----------|------|
| Button | `components/ui/button.tsx` |
| Card, CardHeader, CardContent... | `components/ui/card.tsx` |
| Badge | `components/ui/badge.tsx` |
| Skeleton | `components/ui/skeleton.tsx` |
| Progress | `components/ui/progress.tsx` |
| Input | `components/ui/input.tsx` |
| Label | `components/ui/label.tsx` |
| Select, SelectItem... | `components/ui/select.tsx` |
| Dialog, DialogContent... | `components/ui/dialog.tsx` |
| Separator | `components/ui/separator.tsx` |
| Avatar, AvatarImage... | `components/ui/avatar.tsx` |
| Tooltip, TooltipContent... | `components/ui/tooltip.tsx` |
| ScrollArea | `components/ui/scroll-area.tsx` |
| Tabs, TabsList... | `components/ui/tabs.tsx` |
| DropdownMenu... | `components/ui/dropdown-menu.tsx` |

---

## 🗄️ Database Schema

```
users
  id (text, PK)          ← Clerk userId
  email, full_name, avatar_url, created_at

connected_accounts
  id (uuid, PK)
  user_id → users.id
  item_id                ← Pluggy itemId
  connector_id           ← Pluggy connectorId
  name, logo_url, status, last_synced_at

transactions
  id (uuid, PK)
  user_id → users.id
  pluggy_id              ← unique per user (for upsert dedup)
  account_id, item_id
  date, description, amount, type (credit|debit)
  category, category_pt, balance

budgets
  id (uuid, PK)
  user_id → users.id
  category               ← must match transaction.category
  category_pt, monthly_limit, color
  UNIQUE(user_id, category)
```

---

## 🔌 API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/pluggy/connect-token` | Mints a Pluggy Connect widget token |
| `POST` | `/api/pluggy/connect` | Saves new bank connection + triggers sync |
| `POST` | `/api/pluggy/sync` | Re-syncs transactions for an item |
| `DELETE` | `/api/pluggy/disconnect` | Removes bank from Pluggy + DB |

---

## 🌱 Next Steps & Feature Ideas

### Short-term
- [ ] **Clerk + Supabase JWT integration** — enables proper RLS on client-side queries
- [ ] **Webhook from Pluggy** — receive real-time transaction events instead of polling
- [ ] **User creation on signup** — use a Clerk webhook to auto-create `users` table rows
- [ ] **Mobile nav** — hamburger menu for small screens
- [ ] **Date range picker** — proper calendar UI for transaction filtering

### Medium-term
- [ ] **Spending alerts** — email/push when approaching budget limits
- [ ] **Savings goals** — set a target and track progress over time
- [ ] **Recurring transactions** — detect subscriptions automatically
- [ ] **Net worth tracker** — investment accounts + assets
- [ ] **Transaction categories** — allow manual re-categorization

### Long-term
- [ ] **AI insights** — use Claude API to generate personalized financial tips
- [ ] **Multi-currency** — handle USD/EUR accounts
- [ ] **Export to PDF** — monthly financial report
- [ ] **Family/shared accounts** — multiple users per household

---

## 🐛 Troubleshooting

**"Não autorizado" on API routes**
→ Make sure Clerk middleware is running and the user is signed in.

**Supabase queries returning empty results**
→ Check RLS policies. For development, you can temporarily disable RLS:
```sql
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
```

**Pluggy Connect widget not opening**
→ Check browser console for script load errors. Ensure `cdn.pluggy.ai` is not blocked.

**Transactions not appearing after sync**
→ Check Pluggy dashboard → Items to see if the item synced successfully. Sandbox items may have a delay.

---

## 📄 License

MIT — use freely for personal or commercial projects.

---

Built with ❤️ using Next.js 15, Pluggy, Supabase & Clerk.
