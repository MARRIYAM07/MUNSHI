alter table public.staff_users drop constraint if exists staff_users_role_check;
alter table public.staff_users alter column role set default 'staff';
alter table public.staff_users add constraint staff_users_role_check check (role in ('staff', 'superadmin'));

drop function if exists public.get_payment_verification_status(uuid);

create function public.get_payment_verification_status(bid uuid)
returns table(
  status public.payment_verification_status,
  requested_plan public.plan_type,
  requested_cycle public.billing_cycle_type,
  transaction_reference text,
  submitted_at timestamptz
)
language plpgsql stable security definer set search_path=public as $$
begin
  if not public.is_active_member(bid) then
    raise exception 'forbidden';
  end if;

  return query
  select request.status, request.requested_plan, request.requested_cycle, request.transaction_reference, request.submitted_at
  from public.payment_verification_requests request
  where request.business_id = bid and request.status = 'pending'
  order by request.submitted_at desc
  limit 1;
end;
$$;

revoke all on function public.get_payment_verification_status(uuid) from public;
grant execute on function public.get_payment_verification_status(uuid) to authenticated;
