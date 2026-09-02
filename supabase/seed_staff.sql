insert into public.staff_feature_flags (key, enabled)
values
  ('spendAlerts', true),
  ('whatsappBot', true),
  ('multiCurrency', false),
  ('accountantPortal', true),
  ('bankPdf', true),
  ('taxSuggestions', false)
on conflict (key) do nothing;

insert into public.coupons (code, discount, redemptions, expires_at)
values
  ('LAUNCH50', '50% off Pro', '184 / 300', '31 Oct 2026'),
  ('STUDENTPK', '20% off Pro', '90 / 200', '10 Sep 2026'),
  ('REFERRAL10', '10% off Teams', '122 / 500', '17 Nov 2026')
on conflict (code) do nothing;

insert into public.staff_audit_logs (id, actor, action, detail, created_at)
values
  (
    '91000000-0000-0000-0000-000000000001',
    'Anna',
    'Disabled a stale coupon for a test cohort',
    'Disabled a stale coupon for a test cohort',
    now() - interval '2 hours'
  ),
  (
    '91000000-0000-0000-0000-000000000002',
    'System',
    'Imported 63 new subscriber records from Stripe',
    'Imported 63 new subscriber records from Stripe',
    now() - interval '4 hours'
  ),
  (
    '91000000-0000-0000-0000-000000000003',
    'Rashid',
    'Approved an emergency refund request for 2 users',
    'Approved an emergency refund request for 2 users',
    now() - interval '6 hours'
  ),
  (
    '91000000-0000-0000-0000-000000000004',
    'Anna',
    'Updated the broadcast audience filters for renewing users',
    'Updated the broadcast audience filters for renewing users',
    now() - interval '8 hours'
  )
on conflict (id) do nothing;
