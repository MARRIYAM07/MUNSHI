# Munshi

AI bookkeeping for Pakistani freelancers and small businesses. Munshi reads payment confirmations (Payoneer, Wise, Upwork, Fiverr via Gmail; JazzCash/Easypaisa via SMS forwarding), categorizes transactions automatically, tracks what clients owe, and produces FBR-ready summaries — without manual data entry.

## Status

Actively in development. Not yet deployed. See `docs/design-reference/` for the validated visual design and `docs/design-system.md` for extracted design tokens.

**Built so far:**
- Database schema with Row Level Security (`supabase/migrations/0001_init.sql`, `0002_encryption.sql`)
- Field-level encryption for sensitive data (`lib/crypto.ts`)
- Gmail OAuth ingestion (read-only, sender-allowlisted) and SMS-forwarding ingestion
- Categorization pipeline: merchant cache → keyword rules → Claude Haiku fallback, with learn-on-correction
- Shared UI components (`components/ui/`, `components/app/`)
- Landing page ported to Next.js (`app/page.tsx`)

**Not yet built:**
- Real auth wiring (login/signup pages, session middleware)
- Admin/team-owner/superadmin dashboard pages
- Payment/billing (Stripe)
- Generated Supabase types

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