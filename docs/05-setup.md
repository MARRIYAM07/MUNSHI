# Munshi — Local Development Setup

**Note:** this repo starts empty. The steps below are the setup for
this 4-day build's MVP scope only — manual upload → Claude vision →
ledger → dashboard. No Gmail OAuth or JazzCash setup needed for this
build; those are Coming Soon (see `06-roadmap-and-limitations.md`).

## Prerequisites

- Node.js
- A Supabase project (URL, service role key, anon key)
- An Anthropic API key (Claude, vision-capable model, for extraction)

## 1. Clone and install dependencies

```bash
npm install
```

Single Next.js App Router codebase — no separate backend service (API
routes live in the same app).

## 2. Environment variables

Copy `.env.example` to `.env` and fill in real values. Never commit
`.env` files.

```
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key — NOT the service role key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — full access, keep secret>
ANTHROPIC_API_KEY=<Claude API key>
```

Not needed for this build (Coming Soon — add when that work starts):
`GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`,
`EXCHANGE_RATE_API_KEY` (only needed once multi-currency conversion is
built; the MVP can start PKR-only or with a hardcoded rate if USD
support is needed for the demo).

## 3. Database setup

Apply the **build-now** tables from `04-database-schema.md`
(`users`, `transactions`) via Supabase's SQL Editor. Confirm RLS is
enabled on both before testing with any real data — non-negotiable
even at this scale. Coming-soon tables (`merchant_cache`, `invoices`,
`categories`, `clients`) can wait.

## 4. Running locally

```bash
npm run dev
```

Frontend and API routes serve from the same process.

## 5. Testing the upload flow

Upload a real (or realistic test) payment screenshot/PDF and confirm:
extraction returns amount/currency/date/sender, the row lands in
`transactions`, and the dashboard total updates.

## Common gotchas

- RLS policies must be tested with more than one test user account —
  a single-user test won't catch a missing `user_id` scope
- If a demo needs multi-currency, decide early whether to hardcode a
  rate or wire up ExchangeRate-API — don't discover this the day of
  the demo
