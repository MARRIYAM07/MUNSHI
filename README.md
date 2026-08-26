# Munshi

AI bookkeeping for Pakistani freelancers and small businesses. Munshi reads payment confirmations (Payoneer, Wise, Upwork, Fiverr via Gmail; JazzCash/Easypaisa via SMS forwarding), categorizes transactions automatically, tracks what clients owe, and produces FBR-ready summaries — without manual data entry.

## Status

Actively in development. Not yet deployed. See `docs/design-reference/` for the validated visual design and `docs/design-system.md` for extracted design tokens.

### Done

- **Database & security** — full schema (`supabase/migrations/0001_init.sql`) covering businesses, team_members, connected_accounts, transactions, categories, merchant_cache, clients, invoices, approvals, notifications, subscriptions, staff_users, coupons, feature_flags. Row Level Security on every table, including the private-ledger rule (a team member sees only their own transactions; the owner sees everyone's). Field-level encryption for tokens and raw ingested content (`0002_encryption.sql`, `lib/crypto.ts`). Migrations applied to a real Supabase project.
- **Ingestion** — Gmail OAuth (read-only, sender-allowlisted to Payoneer/Wise/Upwork/Fiverr) and SMS-forwarding (JazzCash/Easypaisa/bank SMS), both writing into a shared staging table with a `parsing_failures` table feeding the staff-facing health panel. 17 parser tests passing.
- **Categorization** — merchant_cache (fuzzy match) → keyword rules → Claude Haiku fallback → learn-on-correction. 5 tests passing.
- **Dashboard API** — `/api/connected-accounts`, `/api/transactions`, `/api/parsing-health`, `/api/categorize/run`, and the correction endpoint, all shape-matched to the frontend's data contracts.
- **Frontend foundation** — merged into a single Next.js app. Design tokens extracted into `app/globals.css` (documented in `docs/design-system.md`). Shared, tested components: `AppShell`, `KpiCard`, `LedgerTable`, `StatusPill`, `Toast`, `Modal`, `ToggleSwitch`. Landing page fully ported (`app/page.tsx`), production build verified.

### Not yet built

1. Generated Supabase types (`lib/database.types.ts`)
2. Real auth — session handling (`proxy.ts`), login/signup pages
3. `0003_client_linking.sql` migration (adds `transactions.client_id`, `clients.next_reminder_at`, `clients.retainer_note`)
4. Admin dashboard (Overview, Transactions, Categorize, Clients, Connected Accounts, Reports)
5. Team-owner console (incl. real member invite flow)
6. Superadmin console (Subscribers, Coupons, Broadcast, Feature Flags, Audit Log; client-side gate replaced with `requireStaff()` middleware)
7. Payment page (real routing/DB writes; Stripe deferred)
8. Stripe billing
9. Approvals mutation routes (`POST /api/approvals/:id/approve` / `decline`)
10. Statement ingest upload / OCR

## Stack

- **Frontend/Backend:** Next.js (App Router), deployed on Vercel
- **Database:** Supabase (Postgres) with Row Level Security
- **AI:** Claude Haiku (Anthropic API) for transaction categorization
- **Auth:** Supabase Auth via `@supabase/ssr`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your own values, see below
npm run dev
```

### Environment variables

See `.env.example` for the full list. You'll need:
- A Supabase project (URL, anon key, service role key)
- `FIELD_ENCRYPTION_KEY` — 32 random bytes, base64-encoded (`openssl rand -base64 32`)
- `ANTHROPIC_API_KEY` — for the categorization fallback
- `CRON_SECRET` — any random string, protects scheduled sync endpoints
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Gmail ingestion (set up later)

### Database setup

Migrations live in `supabase/migrations/`, numbered and append-only. Apply them via the Supabase Dashboard SQL Editor (or `supabase db push` if using the CLI) in order: `0001_init.sql`, then `0002_encryption.sql`.

Optionally seed local/dev data with `supabase/seed.sql`.

### Verify

```bash
npm run typecheck
npm test
```

## Project structure

```
app/                    Next.js App Router pages and API routes
components/ui/          Shared design-system components (KpiCard, LedgerTable, StatusPill, ...)
components/app/         App-level components (AppShell, sidebar/topbar)
components/marketing/   Landing-page-specific components
lib/                    Business logic: categorization, crypto, Gmail/SMS parsing, Supabase clients
supabase/migrations/    Numbered, append-only SQL migrations
docs/design-reference/  Original validated HTML/CSS design spec (not served — reference only)
docs/design-system.md   Extracted design tokens and shared class documentation
```

## Design language

Munshi's visual identity is a "ledger/khata" aesthetic — forest green, red ink, brass, paper tones, IBM Plex typography, mostly sharp corners. `docs/design-reference/` is the source of truth for this; new UI should match it rather than reinterpret it.
