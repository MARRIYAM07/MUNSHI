-- Values are AES-256-GCM envelope-encrypted in the application before insertion.
-- pgcrypto supplies digest/gen_random_bytes for token verification and IDs; encryption keys never enter SQL.
create type public.ingestion_status as enum ('pending','processing','processed','failed');
create table public.staging_transactions (id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade, user_id uuid not null references auth.users(id), provider public.account_provider not null, source_id text not null, occurred_at timestamptz not null, description text not null, amount_minor bigint not null check(amount_minor>=0), currency text not null check(currency ~ '^[A-Z]{3}$'), direction public.transaction_direction not null, counterparty text, encrypted_raw_body bytea, status public.ingestion_status not null default 'pending', error text, created_at timestamptz not null default now(), processed_at timestamptz, unique(business_id,provider,source_id));
create table public.parsing_failures (id uuid primary key default gen_random_uuid(), business_id uuid references public.businesses(id) on delete cascade, user_id uuid references auth.users(id), provider public.account_provider not null, source_id text, encrypted_raw_body bytea, reason text not null, created_at timestamptz not null default now());
create table public.category_keyword_rules (id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id) on delete cascade, keyword text not null, unique(category_id,keyword));
alter table public.connected_accounts add column created_by uuid references auth.users(id), add column forwarding_token_hash bytea, add column enabled boolean not null default true;
alter table public.staging_transactions enable row level security; alter table public.parsing_failures enable row level security; alter table public.category_keyword_rules enable row level security;
create policy staging_private_read on public.staging_transactions for select to authenticated using(public.is_active_member(business_id) and (user_id=auth.uid() or public.is_business_owner(business_id)));
create policy staging_private_write on public.staging_transactions for all to authenticated using(public.is_active_member(business_id) and user_id=auth.uid()) with check(public.is_active_member(business_id) and user_id=auth.uid());
create policy failures_staff_read on public.parsing_failures for select to authenticated using(public.is_staff());
create policy keyword_rules_read on public.category_keyword_rules for select to authenticated using(exists(select 1 from public.categories c where c.id=category_id and (c.business_id is null or public.is_active_member(c.business_id))));
create policy keyword_rules_staff_write on public.category_keyword_rules for all to authenticated using(public.is_staff()) with check(public.is_staff());
create index staging_pending_idx on public.staging_transactions(status,created_at) where status='pending';
create index parsing_failures_provider_created_idx on public.parsing_failures(provider,created_at);
create index transactions_provider_created_idx on public.transactions(source_provider,created_at);
create function public.bump_merchant_cache(cache_id uuid) returns void language sql security definer set search_path=public as $$ update merchant_cache set match_count=match_count+1,last_matched_at=now() where id=cache_id $$;
revoke all on function public.bump_merchant_cache(uuid) from public;
grant execute on function public.bump_merchant_cache(uuid) to service_role;

insert into public.categories(id,business_id,name,kind) values
('10000000-0000-0000-0000-000000000001',null,'Client income','income'),('10000000-0000-0000-0000-000000000002',null,'Utilities','expense'),('10000000-0000-0000-0000-000000000003',null,'Software & tools','expense'),('10000000-0000-0000-0000-000000000004',null,'Platform fees','expense'),('10000000-0000-0000-0000-000000000005',null,'Meals & travel','expense');
insert into public.category_keyword_rules(category_id,keyword) values ('10000000-0000-0000-0000-000000000002','electricity'),('10000000-0000-0000-0000-000000000002','lesco'),('10000000-0000-0000-0000-000000000003','figma'),('10000000-0000-0000-0000-000000000003','internet'),('10000000-0000-0000-0000-000000000004','platform fee');
