-- 0003_client_linking.sql
-- Links transactions to clients, adds reminder/retainer fields to clients.
-- Append-only: no changes to existing columns.

alter table public.transactions
  add column client_id uuid references public.clients(id) on delete set null;

alter table public.clients
  add column next_reminder_at date,
  add column retainer_note text;

create index transactions_client_id_idx on public.transactions(client_id);