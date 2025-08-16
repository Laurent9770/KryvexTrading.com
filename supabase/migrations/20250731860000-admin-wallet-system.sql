-- =====================================================
-- ADMIN & WALLET SYSTEM MIGRATION
-- =====================================================
-- Complete admin and wallet management system for simulation trading
-- =====================================================

-- 1) Admin table
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;
-- Allow admins to see themselves; not needed for others
create policy admin_users_self on public.admin_users
  for select using (auth.uid() = user_id);

-- 2) Wallets (if not already)
create table if not exists public.user_wallets (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_type text not null check (wallet_type in ('funding','trading')),
  asset text not null,
  balance numeric(18,8) not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, wallet_type, asset)
);
alter table public.user_wallets enable row level security;
create policy user_wallets_owner on public.user_wallets
  for select using (auth.uid() = user_id);

-- 3) Transactions log
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset text not null,
  amount numeric(18,8) not null,
  wallet_type text not null check (wallet_type in ('funding','trading')),
  kind text not null check (kind in ('admin_credit','admin_debit','trade','transfer','withdraw','deposit')),
  reason text,
  created_at timestamptz default now(),
  meta jsonb default '{}'
);
alter table public.wallet_transactions enable row level security;
create policy wallet_tx_owner on public.wallet_transactions
  for select using (auth.uid() = user_id);

-- 4) Admin actions audit
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_user uuid references auth.users(id),
  details jsonb default '{}',
  created_at timestamptz default now()
);
alter table public.admin_actions enable row level security;
create policy admin_actions_self on public.admin_actions
  for select using (auth.uid() = admin_id);

-- 5) Unified is_admin (single signature to avoid ambiguity)
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users a where a.user_id = uid);
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- 6) View for role check used by frontend
create or replace view public.user_roles as
select u.id as user_id, case when public.is_admin(u.id) then 'admin' else 'user' end as role
from auth.users u;
grant select on public.user_roles to anon, authenticated;

-- 7) Admin RPC to credit/debit simulation money
create or replace function public.admin_adjust_balance(
  target_user uuid,
  wallet text,
  asset_code text,
  delta numeric,
  reason text default 'simulation adjustment'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance numeric;
  admin_id uuid := auth.uid();
begin
  if not public.is_admin(admin_id) then
    raise exception 'not authorized';
  end if;

  -- Upsert wallet row
  insert into public.user_wallets(user_id, wallet_type, asset, balance)
  values (target_user, wallet, asset_code, 0)
  on conflict (user_id, wallet_type, asset) do nothing;

  update public.user_wallets
    set balance = balance + delta,
        updated_at = now()
    where user_id = target_user and wallet_type = wallet and asset = asset_code
  returning balance into new_balance;

  insert into public.wallet_transactions(user_id, asset, amount, wallet_type, kind, reason, meta)
  values (target_user, asset_code, delta, wallet, case when delta >= 0 then 'admin_credit' else 'admin_debit' end, reason, jsonb_build_object('simulation', true));

  insert into public.admin_actions(admin_id, action, target_user, details)
  values (admin_id, 'adjust_balance', target_user, jsonb_build_object('wallet', wallet, 'asset', asset_code, 'delta', delta, 'reason', reason, 'simulation', true));

  return json_build_object('user_id', target_user, 'wallet', wallet, 'asset', asset_code, 'new_balance', new_balance, 'simulation', true);
end;
$$;

grant execute on function public.admin_adjust_balance(uuid, text, text, numeric, text) to authenticated;

-- 8) RLS escalation notes:
-- RPC uses SECURITY DEFINER to bypass RLS. Ensure owner is postgres; revoke direct update/insert perms from anon/authenticated on user_wallets.
revoke insert, update, delete on public.user_wallets from anon, authenticated;
revoke insert, update, delete on public.wallet_transactions from anon, authenticated;

-- 9) Seed an admin if needed (replace with real UUID)
-- insert into public.admin_users(user_id, email) values ('<ADMIN-UUID>', 'kryvextrading@gmail.com') on conflict do nothing;

-- 10) Create indexes for performance
create index if not exists idx_user_wallets_user_id on public.user_wallets(user_id);
create index if not exists idx_wallet_transactions_user_id on public.wallet_transactions(user_id);
create index if not exists idx_wallet_transactions_created_at on public.wallet_transactions(created_at);
create index if not exists idx_admin_actions_admin_id on public.admin_actions(admin_id);
create index if not exists idx_admin_actions_created_at on public.admin_actions(created_at);

-- 11) Enable realtime for wallet updates
alter publication supabase_realtime add table public.user_wallets;
alter publication supabase_realtime add table public.wallet_transactions;
