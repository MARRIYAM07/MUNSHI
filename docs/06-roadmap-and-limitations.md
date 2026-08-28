# Munshi — Roadmap & Known Limitations

An honest snapshot of what's working, what's this build's target, and
what's documented-but-deferred. Update this as things move from one
category to another. **This repo starts empty** — a separate, more
advanced Munshi effort exists and will be shared/merged in later; this
doc tracks only this 4-day build's own progress.

## Working / confirmed

see 02-architechture.md file for more details

## Building now (4-day MVP target)

- Core pages: landing, login, signup, upload, dashboard — styled to
  Munshi's ledger/khata visual theme, downplayed/simplified relative
  to the fuller design
- Upload → Claude vision extraction → ledger write, for
  screenshot/PDF payment proofs
- Dashboard: this month's total (PKR), transaction list, non-filer
  flag
- Supabase with RLS enabled from the first migration on `users` and
  `transactions`
- Any feature not built in this window shown honestly as a labeled
  "Coming Soon" element in the UI, not hidden

## Coming soon (designed, documented, deferred past this build)

- Gmail OAuth ingestion, JazzCash SMS-forward
- `merchant_cache` categorization layer, Claude Haiku fallback routing
- WhatsApp quick-logging
- `invoices` / `categories` tables, "who owes me" tracker
- Staff role, superadmin dashboard wired to real aggregate data
- Field-level encryption, per-tenant key management, break-glass
  support access, audit logging
- Full FBR tax-slab calculation (deliberately out of scope
  indefinitely — see `03-categorization-and-ai-behavior.md`)

## Open questions / needs a decision before build

- **LLM fallback behavior on API failure** — retry, secondary
  provider, or a "processing delayed" state; no decision made (see
  `03-categorization-and-ai-behavior.md`)
- **Out-of-scope upload handling** — what happens when an uploaded
  file isn't a financial transaction at all
- **Merge plan with the more advanced version** — once that repo is
  shared, decide whether this 4-day build's simpler schema/pages get
  replaced wholesale or reconciled piece by piece

## Known gaps in documentation (not code)

- No migration files exist yet for the schema in
  `04-database-schema.md` — build-now tables should get a tracked
  migration as soon as they're created, not added directly via the
  Supabase console
- `05-setup.md` describes the intended setup for this build; treat it
  as a target until the first real `npm run dev` confirms it

## Process notes worth preserving

- Pricing model has shifted across documents: the incubator pitch deck
  shows PKR 500–1,000/month flat tiers; the current internal decision
  is USD-primary pricing with PKR shown alongside, reflecting that the
  primary Phase 1 segment (freelancers) is paid in USD. Any future
  pitch materials should be reconciled to the USD-primary decision to
  avoid presenting two different pricing models to the same audience
- A separate, more advanced Munshi codebase (fuller frontend, deeper
  architecture work) exists outside this repo and will be shared
  later — when it arrives, reconcile against the "Coming soon" list
  above rather than assuming a from-scratch rebuild of everything
