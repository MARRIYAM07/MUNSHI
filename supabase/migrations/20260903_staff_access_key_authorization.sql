drop policy if exists payment_verification_superadmin_read on public.payment_verification_requests;

do $$
declare
  resolution_constraint text;
begin
  select conname into resolution_constraint
  from pg_constraint
  where conrelid = 'public.payment_verification_requests'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%reviewed_by%';

  if resolution_constraint is not null then
    execute format('alter table public.payment_verification_requests drop constraint %I', resolution_constraint);
  end if;
end;
$$;

alter table public.payment_verification_requests
  add constraint payment_verification_resolution_check check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null and rejection_reason is null)
    or (status = 'approved' and reviewed_at is not null and rejection_reason is null)
    or (status = 'rejected' and reviewed_at is not null and rejection_reason is not null)
  );

create or replace function public.resolve_payment_verification_request(request_id uuid, decision text, rejection_reason_input text default null)
returns public.payment_verification_status
language plpgsql security definer set search_path=public as $$
declare
  request public.payment_verification_requests%rowtype;
  next_period_end timestamptz;
  notification_title text;
  notification_body text;
begin
  if auth.role() <> 'service_role' then
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
    set status = 'approved', reviewed_at = now(), reviewed_by = null, rejection_reason = null
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
    set status = 'rejected', reviewed_at = now(), reviewed_by = null, rejection_reason = trim(rejection_reason_input)
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
    'Staff access code',
    case when decision = 'approve' then 'Approved manual payment verification' else 'Rejected manual payment verification' end,
    'Business ' || request.business_id::text || ' · request ' || request.id::text || ' · reference ' || request.transaction_reference
  );

  return case when decision = 'approve' then 'approved'::public.payment_verification_status else 'rejected'::public.payment_verification_status end;
end;
$$;

revoke all on function public.resolve_payment_verification_request(uuid, text, text) from public;
revoke execute on function public.resolve_payment_verification_request(uuid, text, text) from authenticated;
grant execute on function public.resolve_payment_verification_request(uuid, text, text) to service_role;
