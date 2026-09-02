-- 1. Staff users role adjustments
alter table public.staff_users add column if not exists role text;
update public.staff_users set role = 'superadmin' where role is null;
alter table public.staff_users alter column role set default 'superadmin';
alter table public.staff_users alter column role set not null;
alter table public.staff_users drop constraint if exists staff_users_role_check;
alter table public.staff_users add constraint staff_users_role_check check (role in ('superadmin'));

create or replace function public.is_superadmin(uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.staff_users where user_id = uid and role = 'superadmin')
$$;

revoke all on function public.is_superadmin(uuid) from public;
grant execute on function public.is_superadmin(uuid) to authenticated;

-- 2. Safe enum type creation (fixes 42710 error)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_verification_status') then
    create type public.payment_verification_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

-- 3. Payment verification requests table
create table if not exists public.payment_verification_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  requested_plan public.plan_type not null check (requested_plan in ('pro', 'teams')),
  requested_cycle public.billing_cycle_type not null,
  rail text not null check (rail in ('jazzcash', 'easypaisa', 'bank')),
  transaction_reference text not null check (char_length(transaction_reference) between 4 and 128),
  contact_phone text not null check (char_length(contact_phone) between 5 and 32),
  whatsapp text check (whatsapp is null or char_length(whatsapp) between 5 and 32),
  receipt_path text not null unique,
  receipt_name text not null check (char_length(receipt_name) between 1 and 255),
  receipt_content_type text not null check (receipt_content_type in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf')),
  receipt_size integer not null check (receipt_size > 0 and receipt_size <= 5242880),
  status public.payment_verification_status not null default 'pending',
  idempotency_key uuid not null unique,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) between 1 and 500),
  check ((status = 'pending' and reviewed_at is null and reviewed_by is null and rejection_reason is null) or (status = 'approved' and reviewed_at is not null and reviewed_by is not null and rejection_reason is null) or (status = 'rejected' and reviewed_at is not null and reviewed_by is not null and rejection_reason is not null))
);

create unique index if not exists payment_verification_one_pending_per_business on public.payment_verification_requests(business_id) where status = 'pending';
create index if not exists payment_verification_queue_idx on public.payment_verification_requests(status, submitted_at desc);

alter table public.payment_verification_requests enable row level security;

drop policy if exists payment_verification_superadmin_read on public.payment_verification_requests;
create policy payment_verification_superadmin_read on public.payment_verification_requests for select to authenticated using (public.is_superadmin());

-- 4. Storage Bucket
insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do update set public = false;

drop policy if exists payment_receipts_service_role_only on storage.objects;
create policy payment_receipts_service_role_only on storage.objects for all to service_role using (bucket_id = 'payment-receipts') with check (bucket_id = 'payment-receipts');

-- 5. Verification status function
create or replace function public.get_payment_verification_status(bid uuid)
returns table(status public.payment_verification_status, requested_plan public.plan_type, transaction_reference text, submitted_at timestamptz)
language plpgsql stable security definer set search_path=public as $$
begin
  if not public.is_active_member(bid) then
    raise exception 'forbidden';
  end if;

  return query
  select request.status, request.requested_plan, request.transaction_reference, request.submitted_at
  from public.payment_verification_requests request
  where request.business_id = bid and request.status = 'pending'
  order by request.submitted_at desc
  limit 1;
end;
$$;

revoke all on function public.get_payment_verification_status(uuid) from public;
grant execute on function public.get_payment_verification_status(uuid) to authenticated;

-- 6. Protect billing fields triggers
create or replace function public.protect_billing_fields() returns trigger language plpgsql set search_path=public as $$
begin
  if (old.plan is distinct from new.plan or old.billing_cycle is distinct from new.billing_cycle)
    and coalesce(current_setting('app.payment_verification_resolution', true), '') <> 'active' then
    raise exception 'Billing changes require payment verification';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_business_billing_fields on public.businesses;
create trigger protect_business_billing_fields before update on public.businesses for each row execute function public.protect_billing_fields();

-- 7. Protect subscription state triggers
create or replace function public.protect_subscription_state() returns trigger language plpgsql set search_path=public as $$
begin
  if coalesce(current_setting('app.payment_verification_resolution', true), '') <> 'active' then
    raise exception 'Subscription changes require payment verification';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_subscription_state_insert on public.subscriptions;
create trigger protect_subscription_state_insert before insert on public.subscriptions for each row execute function public.protect_subscription_state();

drop trigger if exists protect_subscription_state_update on public.subscriptions;
create trigger protect_subscription_state_update before update on public.subscriptions for each row execute function public.protect_subscription_state();

drop policy if exists subscriptions_member_all on public.subscriptions;
drop policy if exists subscriptions_member_read on public.subscriptions;
create policy subscriptions_member_read on public.subscriptions for select to authenticated using (public.is_active_member(business_id));

-- 8. Khata limit trigger
create or replace function public.enforce_khata_transaction_limit() returns trigger language plpgsql security definer set search_path=public as $$
declare
  active_plan public.plan_type;
  entry_count integer;
begin
  select plan into active_plan from public.businesses where id = new.business_id;
  if active_plan = 'khata' then
    select count(*) into entry_count
    from public.transactions
    where business_id = new.business_id
      and occurred_at >= date_trunc('month', now())
      and occurred_at < date_trunc('month', now()) + interval '1 month';

    if entry_count >= 100 then
      raise exception 'Khata includes up to 100 ledger entries each month';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_khata_transaction_limit on public.transactions;
create trigger enforce_khata_transaction_limit before insert on public.transactions for each row execute function public.enforce_khata_transaction_limit();

-- 9. Create business function
create or replace function public.create_business(business_name text, business_currency text default 'PKR', business_plan public.plan_type default 'khata', cycle public.billing_cycle_type default 'monthly') returns uuid language plpgsql security definer set search_path=public as $$
declare
  bid uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.businesses(owner_user_id, name, currency, plan, billing_cycle)
  values(auth.uid(), business_name, business_currency, 'khata', 'monthly')
  returning id into bid;

  insert into public.team_members(business_id, user_id, role, status, joined_at)
  values(bid, auth.uid(), 'owner', 'active', now());

  return bid;
end;
$$;

-- 10. Resolve payment verification request function
create or replace function public.resolve_payment_verification_request(request_id uuid, decision text, rejection_reason_input text default null)
returns public.payment_verification_status
language plpgsql security definer set search_path=public as $$
declare
  request public.payment_verification_requests%rowtype;
  reviewer_name text;
  next_period_end timestamptz;
  notification_title text;
  notification_body text;
begin
  if not public.is_superadmin() then
    raise exception 'forbidden';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'Invalid payment decision';
  end if;

  select * into request
  from public.payment_verification_requests
  where id = request_id
  for update;

  if not found then
    raise exception 'Payment verification request not found';
  end if;

  if request.status <> 'pending' then
    raise exception 'Payment verification request has already been resolved';
  end if;

  if decision = 'reject' and char_length(trim(coalesce(rejection_reason_input, ''))) = 0 then
    raise exception 'A rejection reason is required';
  end if;

  if char_length(trim(coalesce(rejection_reason_input, ''))) > 500 then
    raise exception 'Rejection reason is too long';
  end if;

  select coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), email, 'Superadmin')
  into reviewer_name
  from auth.users
  where id = auth.uid();

  perform set_config('app.payment_verification_resolution', 'active', true);

  if decision = 'approve' then
    next_period_end := now() + case when request.requested_cycle = 'yearly' then interval '1 year' else interval '1 month' end;

    update public.businesses
    set plan = request.requested_plan, billing_cycle = request.requested_cycle
    where id = request.business_id;

    insert into public.subscriptions(business_id, status, current_period_end)
    values(request.business_id, 'active', next_period_end)
    on conflict (business_id) do update set status = excluded.status, current_period_end = excluded.current_period_end;

    update public.payment_verification_requests
    set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), rejection_reason = null
    where id = request.id;

    notification_title := 'Payment verified';
    notification_body := initcap(request.requested_plan::text) || ' is now active for your business.';
  else
    update public.businesses
    set plan = 'khata', billing_cycle = 'monthly'
    where id = request.business_id;

    insert into public.subscriptions(business_id, status, current_period_end)
    values(request.business_id, 'inactive', null)
    on conflict (business_id) do update set status = excluded.status, current_period_end = excluded.current_period_end;

    update public.payment_verification_requests
    set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), rejection_reason = trim(rejection_reason_input)
    where id = request.id;

    notification_title := 'Payment verification needs attention';
    notification_body := 'Your payment could not be verified. Your business remains on Khata. Reason: ' || trim(rejection_reason_input);
  end if;

  insert into public.notifications(business_id, user_id, type, title, body)
  select request.business_id, member.user_id, 'pay', notification_title, notification_body
  from public.team_members member
  where member.business_id = request.business_id
    and member.status = 'active'
    and member.user_id is not null;

  insert into public.audit_logs(actor_name, action, details)
  values(
    coalesce(reviewer_name, 'Superadmin'),
    case when decision = 'approve' then 'Approved manual payment verification' else 'Rejected manual payment verification' end,
    'Business ' || request.business_id::text || ' · request ' || request.id::text || ' · reference ' || request.transaction_reference
  );

  return case when decision = 'approve' then 'approved'::public.payment_verification_status else 'rejected'::public.payment_verification_status end;
end;
$$;

revoke all on function public.resolve_payment_verification_request(uuid, text, text) from public;
grant execute on function public.resolve_payment_verification_request(uuid, text, text) to authenticated;