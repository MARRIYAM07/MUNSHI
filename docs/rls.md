# RLS policy review

- Business data is available only to active team members. Membership changes require the owner.
- A transaction or staged item is visible to its `user_id` and the active business owner; ordinary teammates cannot see it.
- Clients, invoices, approvals, account status and business categories are shared with active members.
- Global categories and keyword rules are readable by signed-in users but only staff/service-role operations can change global rules.
- Raw parsing failures are staff-only. Raw bodies remain encrypted even for staff; the parsing-health API returns aggregates only.
- `staff_users`, coupons, flags and audit records are inaccessible to ordinary users. Staff enrollment has no client policy and must use the service role.
- `create_business` atomically creates the business and first owner membership, avoiding an RLS bootstrap gap.

The service-role key bypasses RLS and therefore belongs only in server route handlers, never browser code.
