-- ═══════════════════════════════════════════════════════
-- Finança — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 0. Extensions
-- ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. users
-- Mirrors Clerk users; created on first login
-- ──────────────────────────────────────────────
create table if not exists public.users (
  id            text primary key,           -- Clerk userId (e.g. "user_2abc...")
  email         text not null unique,
  full_name     text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

comment on table public.users is 'App users — id is the Clerk userId';

-- RLS
alter table public.users enable row level security;

create policy "Users can read their own row"
  on public.users for select
  using (auth.uid()::text = id);

create policy "Users can update their own row"
  on public.users for update
  using (auth.uid()::text = id);

-- ──────────────────────────────────────────────
-- 2. connected_accounts
-- One row per bank connected via Pluggy
-- ──────────────────────────────────────────────
create table if not exists public.connected_accounts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null references public.users(id) on delete cascade,
  item_id         text not null,             -- Pluggy itemId
  connector_id    integer not null,          -- Pluggy connectorId (numeric)
  name            text not null,             -- e.g. "Nubank", "Itaú"
  logo_url        text,
  status          text not null default 'updating'
                    check (status in ('updated', 'updating', 'login_error', 'outdated')),
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),

  unique(user_id, item_id)
);

comment on table public.connected_accounts is 'Banks connected via Pluggy Open Finance';

-- Index for fast user lookups
create index if not exists connected_accounts_user_id_idx on public.connected_accounts(user_id);

-- RLS
alter table public.connected_accounts enable row level security;

create policy "Users can read their own connected accounts"
  on public.connected_accounts for select
  using (auth.uid()::text = user_id);

create policy "Users can insert their own connected accounts"
  on public.connected_accounts for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own connected accounts"
  on public.connected_accounts for update
  using (auth.uid()::text = user_id);

create policy "Users can delete their own connected accounts"
  on public.connected_accounts for delete
  using (auth.uid()::text = user_id);

-- ──────────────────────────────────────────────
-- 3. transactions
-- Imported from Pluggy; updated on each sync
-- ──────────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null references public.users(id) on delete cascade,
  account_id      text not null,             -- Pluggy accountId
  item_id         text not null,             -- Pluggy itemId
  pluggy_id       text not null,             -- Pluggy transaction id (for dedup)
  date            date not null,
  description     text not null,
  amount          numeric(14,2) not null,    -- positive = credit, negative = debit
  type            text not null check (type in ('credit', 'debit')),
  category        text,                      -- Pluggy category (English)
  category_pt     text,                      -- Portuguese name
  balance         numeric(14,2),             -- Account balance after this transaction
  created_at      timestamptz not null default now(),

  unique(user_id, pluggy_id)
);

comment on table public.transactions is 'Financial transactions imported from Pluggy';

-- Indexes for common query patterns
create index if not exists transactions_user_date_idx     on public.transactions(user_id, date desc);
create index if not exists transactions_user_type_idx     on public.transactions(user_id, type);
create index if not exists transactions_account_id_idx    on public.transactions(account_id);
create index if not exists transactions_item_id_idx       on public.transactions(item_id);
create index if not exists transactions_category_idx      on public.transactions(user_id, category);

-- RLS
alter table public.transactions enable row level security;

create policy "Users can read their own transactions"
  on public.transactions for select
  using (auth.uid()::text = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid()::text = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid()::text = user_id);

-- ──────────────────────────────────────────────
-- 4. budgets
-- Monthly spend limits per category
-- ──────────────────────────────────────────────
create table if not exists public.budgets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null references public.users(id) on delete cascade,
  category        text not null,             -- Pluggy category key (English)
  category_pt     text not null,             -- Portuguese display name
  monthly_limit   numeric(12,2) not null check (monthly_limit > 0),
  color           text not null default '#0ea5e9',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(user_id, category)
);

comment on table public.budgets is 'Monthly spending limits per category';

create index if not exists budgets_user_id_idx on public.budgets(user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- RLS
alter table public.budgets enable row level security;

create policy "Users can read their own budgets"
  on public.budgets for select
  using (auth.uid()::text = user_id);

create policy "Users can insert their own budgets"
  on public.budgets for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own budgets"
  on public.budgets for update
  using (auth.uid()::text = user_id);

create policy "Users can delete their own budgets"
  on public.budgets for delete
  using (auth.uid()::text = user_id);

-- ──────────────────────────────────────────────
-- 5. Realtime — enable for live updates
-- ──────────────────────────────────────────────
-- Enable realtime publication for tables that need live updates
begin;
  -- Drop existing if re-running
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.connected_accounts;

-- ──────────────────────────────────────────────
-- 6. Service role bypass
-- Allows our API routes (which use service role key)
-- to write data on behalf of users without RLS blocking
-- ──────────────────────────────────────────────
-- NOTE: The service role key bypasses RLS automatically.
-- The policies above only apply to anon/authenticated roles.
-- Our API routes use createAdminClient() which uses the service
-- role key — so they can write for any user_id safely.

-- ──────────────────────────────────────────────
-- 7. Helper views (optional but useful)
-- ──────────────────────────────────────────────

-- Monthly spending summary per user
create or replace view public.monthly_spending as
select
  user_id,
  date_trunc('month', date)::date as month,
  category,
  category_pt,
  sum(case when type = 'debit' then abs(amount) else 0 end) as total_spent,
  sum(case when type = 'credit' then amount else 0 end) as total_received,
  count(*) as transaction_count
from public.transactions
group by user_id, date_trunc('month', date), category, category_pt;

comment on view public.monthly_spending is 'Pre-aggregated monthly spending by category';

-- ──────────────────────────────────────────────
-- 8. Sample seed data (for development only)
-- Remove or comment out in production
-- ──────────────────────────────────────────────
-- INSERT INTO public.users (id, email, full_name) VALUES
--   ('user_dev_001', 'dev@example.com', 'Dev User');
--
-- INSERT INTO public.budgets (user_id, category, category_pt, monthly_limit, color) VALUES
--   ('user_dev_001', 'Food',          'Alimentação',   800.00, '#f97316'),
--   ('user_dev_001', 'Transport',     'Transporte',    300.00, '#3b82f6'),
--   ('user_dev_001', 'Entertainment', 'Entretenimento',200.00, '#a855f7'),
--   ('user_dev_001', 'Health',        'Saúde',         400.00, '#ec4899');
