create extension if not exists pgcrypto;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount text not null,
  redemptions text default '0 / 250',
  expires_at text not null,
  created_at timestamptz default now()
);

-- Ensure columns exist
alter table public.coupons add column if not exists discount text;
alter table public.coupons add column if not exists redemptions text default '0 / 250';
alter table public.coupons add column if not exists expires_at text;
alter table public.coupons add column if not exists created_at timestamptz default now();

-- Convert expires_at to text safely if it was originally created as timestamptz
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'coupons'
      and column_name = 'expires_at'
      and data_type like 'timestamp%'
  ) then
    alter table public.coupons alter column expires_at type text using to_char(expires_at, 'YYYY-MM-DD');
  end if;
end $$;

-- Populate null values
update public.coupons
set redemptions = '0 / 250'
where redemptions is null;

update public.coupons
set discount = ''
where discount is null;

update public.coupons
set expires_at = to_char(now(), 'YYYY-MM-DD')
where expires_at is null;

alter table public.coupons
  alter column discount set not null,
  alter column expires_at set not null,
  alter column created_at set default now();

-- Staff feature flags table
create table if not exists public.staff_feature_flags (
  key text primary key,
  enabled boolean default false,
  updated_at timestamptz default now()
);

-- Staff audit logs table
create table if not exists public.staff_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  detail text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.coupons enable row level security;
alter table public.staff_feature_flags enable row level security;
alter table public.staff_audit_logs enable row level security;

-- Policies for coupons
drop policy if exists "coupons_service_role_all" on public.coupons;
create policy "coupons_service_role_all"
  on public.coupons for all to service_role
  using (true) with check (true);

drop policy if exists "coupons_staff_all" on public.coupons;
create policy "coupons_staff_all"
  on public.coupons for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Policies for feature flags
drop policy if exists "staff_feature_flags_service_role_all" on public.staff_feature_flags;
create policy "staff_feature_flags_service_role_all"
  on public.staff_feature_flags for all to service_role
  using (true) with check (true);

drop policy if exists "staff_feature_flags_staff_all" on public.staff_feature_flags;
create policy "staff_feature_flags_staff_all"
  on public.staff_feature_flags for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Policies for audit logs
drop policy if exists "staff_audit_logs_service_role_all" on public.staff_audit_logs;
create policy "staff_audit_logs_service_role_all"
  on public.staff_audit_logs for all to service_role
  using (true) with check (true);

drop policy if exists "staff_audit_logs_staff_all" on public.staff_audit_logs;
create policy "staff_audit_logs_staff_all"
  on public.staff_audit_logs for all to authenticated
  using (public.is_staff()) with check (public.is_staff());