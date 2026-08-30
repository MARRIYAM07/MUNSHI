create extension if not exists pgcrypto;

create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  message text not null,
  sent_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  issue text not null,
  priority text not null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_name text not null,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount text,
  redemptions_count integer not null default 0,
  max_redemptions integer not null default 250,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coupons add column if not exists discount text;
alter table public.coupons add column if not exists redemptions_count integer default 0;
alter table public.coupons add column if not exists max_redemptions integer default 250;
alter table public.coupons add column if not exists expires_at timestamptz;
alter table public.coupons add column if not exists created_at timestamptz default now();

create table if not exists public.feature_flags (
  key text primary key,
  name text,
  description text,
  target_plan text,
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags add column if not exists name text;
alter table public.feature_flags add column if not exists description text;
alter table public.feature_flags add column if not exists target_plan text;
alter table public.feature_flags add column if not exists is_enabled boolean default false;
alter table public.feature_flags add column if not exists updated_at timestamptz default now();

alter table public.feature_flags
  alter column is_enabled set default false,
  alter column updated_at set default now();

alter table public.coupons
  alter column redemptions_count set default 0,
  alter column max_redemptions set default 250,
  alter column created_at set default now();

insert into public.feature_flags (key, name, description, target_plan, is_enabled, updated_at)
values
  ('ai_spend_anomaly_alerts', 'AI spend-anomaly alerts', 'Notify admins of unusual spend patterns.', 'all', true, now()),
  ('whatsapp_bot_reminders', 'WhatsApp Bot for reminders', 'Send reminder prompts across customer conversations.', 'all', true, now()),
  ('multi_currency_auto_conversion', 'Multi-currency auto-conversion', 'Auto-convert transaction values into the business currency.', 'pro', false, now()),
  ('accountant_handoff_portal', 'Accountant hand-off portal', 'Share books and reports with the accountant.', 'teams', true, now()),
  ('bank_statement_pdf_import', 'Bank statement PDF import', 'Allow PDF upload and statement extraction.', 'all', true, now()),
  ('tax_saving_suggestions_engine', 'Tax-saving suggestions engine', 'Recommend tax-saving entries and structure.', 'pro', false, now())
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  target_plan = excluded.target_plan,
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.coupons (code, discount, redemptions_count, max_redemptions, expires_at)
values
  ('LAUNCH50', '50% off Pro', 184, 300, '2026-10-31T00:00:00Z'),
  ('STUDENTPK', '20% off Pro', 90, 200, '2026-09-10T00:00:00Z'),
  ('REFERRAL10', '10% off Teams', 122, 500, '2026-11-17T00:00:00Z')
on conflict (code) do nothing;

insert into public.audit_logs (actor_name, action, details, created_at)
values
  ('Anna', 'Disabled a stale coupon for a test cohort', 'Coupon refresh audit', now() - interval '2 hours'),
  ('System', 'Imported 63 new subscriber records from Stripe', 'Data sync', now() - interval '4 hours'),
  ('Rashid', 'Approved an emergency refund request for 2 users', 'Refund queue update', now() - interval '6 hours'),
  ('Anna', 'Updated the broadcast audience filters for renewing users', 'Audience targeting', now() - interval '8 hours');

insert into public.support_tickets (user_name, issue, priority, status, created_at)
values
  ('Areeba Waseem', 'Upwork payout missing from August export', 'High', 'OPEN', now() - interval '2 hours'),
  ('Nadir Ashraf', 'Need help restoring a cancelled renewal', 'Medium', 'OPEN', now() - interval '5 hours'),
  ('Hina Yousaf', 'Question about invoice formatting for 2025', 'Low', 'OPEN', now() - interval '11 hours');

alter table public.broadcasts enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.coupons enable row level security;
alter table public.feature_flags enable row level security;

create policy if not exists "broadcasts_service_role_all" on public.broadcasts for all to service_role using (true) with check (true);
create policy if not exists "broadcasts_staff_all" on public.broadcasts for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy if not exists "support_tickets_service_role_all" on public.support_tickets for all to service_role using (true) with check (true);
create policy if not exists "support_tickets_staff_all" on public.support_tickets for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy if not exists "audit_logs_service_role_all" on public.audit_logs for all to service_role using (true) with check (true);
create policy if not exists "audit_logs_staff_read" on public.audit_logs for select to authenticated using (public.is_staff());
create policy if not exists "audit_logs_staff_insert" on public.audit_logs for insert to authenticated with check (public.is_staff());

create policy if not exists "coupons_service_role_all" on public.coupons for all to service_role using (true) with check (true);
create policy if not exists "coupons_staff_all" on public.coupons for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy if not exists "feature_flags_service_role_all" on public.feature_flags for all to service_role using (true) with check (true);
create policy if not exists "feature_flags_staff_all" on public.feature_flags for all to authenticated using (public.is_staff()) with check (public.is_staff());
