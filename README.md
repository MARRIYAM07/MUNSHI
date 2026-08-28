# 📒 Munshi (منشی)
### AI Bookkeeping for Pakistan's Freelance Economy

> *"QuickBooks doesn't know what a Meezan transaction screenshot is. We do. That's the whole product."*

**Alibaba Cloud Hackathon 2026 — Financial Inclusion Track**
Built by **Marriyam Andeel** & **Amna Kousar** — BS Artificial Intelligence, COMSATS University Islamabad (Lahore Campus)

---

> ⚠️ **Before you push this:** the checklist in [Build Status](#build-status) below is written from our documentation and dev conversations, not a live read of the repo. Confirm every box against what's actually running before this goes out — an unchecked claim in front of judges is worse than an honest "Coming Soon."

---

## The Problem, In One Person

Meet **Hamza** — 24, a CS grad freelancing on Upwork, earning $300–600/month from international clients.

He's paid through **Payoneer**, into a **Meezan** account. One client pays via **Wise**. Another sends money on WhatsApp — *"bhai account number do, transfer karta hun."* A fourth has owed him for six weeks; he keeps forgetting to follow up.

His "accounting system" is a WhatsApp chat, a screenshots folder he never opens, and memory. Ask him what he earned last quarter and he'll spend two hours scrolling receipts to guess — and probably get it wrong. He has no idea what he owes FBR. He's a non-filer, paying higher withholding tax on every bank transaction, without knowing it.

**This isn't one person. It's most of Pakistan's 2.3M+ active freelancers**, who earned **$1.76B in export income in FY26** (up 78% YoY) with **zero bookkeeping tools built for how they actually get paid.**

Munshi's real competitor isn't QuickBooks. It's a WhatsApp note to self. That's what we're replacing.

---

## Why This Is Hard (Not Just "Add AI To A Ledger")

This is the section that separates a bookkeeping CRUD app from Munshi:

| Constraint | Why it's non-trivial |
|---|---|
| **No unified payment rail** | Freelancers get paid across Payoneer, Wise, direct bank transfer, and WhatsApp — each with a different notification format, no shared schema |
| **Messy, mixed-language source data** | Bank SMS and screenshots mix Urdu and English, inconsistent formats across Meezan, HBL, Easypaisa, JazzCash, Payoneer, Fiverr, Upwork |
| **Multi-currency at transaction granularity** | Every payment must convert to PKR at the *historical* rate on its *own* transaction date — not today's rate — or the ledger is silently wrong |
| **Regulatory liability, not just UX** | FBR guidance carries real legal risk if wrong. We had to design a scope boundary — *awareness, not advice* — and hold it everywhere in the product, not just once |
| **Cost has to scale down, not up** | Naive design = one LLM call per transaction forever. We had to design a caching architecture where marginal AI cost trends toward zero as usage grows |
| **Privacy-by-architecture, not policy** | Real financial data demands row-level security and field-level encryption enforced at the database layer — not a privacy policy promising good behavior |

None of these are solved by "wrap GPT around a spreadsheet." Each one shaped a real architectural decision below.

---

## The Core Loop

```
User uploads payment screenshot / PDF / forwards a WhatsApp message
                        ↓
     Claude (vision) extracts amount, currency, date, sender, type
                        ↓
        One clarifying question only if a field is ambiguous
                        ↓
   merchant_cache lookup → known pattern? instant categorization
                        ↓
        No match → Claude Haiku categorizes, writes back to cache
                        ↓
              Saved to a running, correctable ledger
                        ↓
   Dashboard: monthly total (PKR), non-filer flag, transaction list
```

---

## Architecture

```
INGESTION                    PROCESSING                  OUTPUT
┌───────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│ Screenshot/PDF │ ──▶  │ LLM Vision     │      │ Dashboard:           │
│ upload         │      │ extraction        │      │  · Monthly total(PKR)│
└───────────────┘      └────────┬─────────┘      │  · Non-filer flag     │
┌───────────────┐               ▼                 │  · Transaction list   │
│ Gmail (read-   │      ┌──────────────────┐      │  · Who-owes-me tracker│
│ only, payment- │ ──▶  │ merchant_cache    │ ──▶  └─────────────────────┘
│ domain scoped) │      │ lookup            │
└───────────────┘      └────────┬─────────┘
┌───────────────┐               ▼ (cache miss)
│ JazzCash       │      ┌──────────────────┐      ┌─────────────────────┐
│ SMS-forward    │ ──▶  │ LLM/AI      │ ──▶  │ Ledger (Supabase,    │
└───────────────┘      │ categorization    │      │ RLS-enforced,        │
┌───────────────┐      └──────────────────┘      │ field-level encrypted)│
│ WhatsApp       │                                 └─────────────────────┘
│ quick-log      │ ──────────────────────────────────────▲
└───────────────┘                                          │
                                                one-tap correction
                                              writes back to merchant_cache
```

**Single Next.js (App Router) application on Vercel, backed by Supabase (Postgres).** No separate backend service — API routes live in the same deployment. One AI provider (Anthropic) throughout, so there's one API relationship to manage, not a fragile multi-vendor pipeline.

---

## The Margin Lever: Why This Doesn't Bankrupt Itself At Scale

The categorization pipeline is the core cost-engineering decision in the product:

1. Normalize the transaction description
2. Look up `merchant_cache` for a known pattern → **deterministic match, zero LLM cost**
3. Cache miss → call **Claude Haiku** once, categorize, write the result back to `merchant_cache` — that merchant is never sent to an LLM again, for *any* user
4. User can always one-tap correct → correction also updates the cache

Because the cache is shared across users, **cost per user trends down over time**, and new users benefit from a cache already built by everyone before them. At scale, hosting and storage — not AI inference — become the dominant cost. This is the difference between a demo that works and a business model that survives 10,000 users instead of 20.

**Model tiering:** Claude Haiku handles the categorization fallback (cheap, only on cache misses). Claude Sonnet is the planned escalation for harder cases once there's paying usage to justify it. Claude's vision capability handles receipt/document extraction directly — no separate OCR pipeline to integrate or maintain.

---

## Why Pakistan-Specific (The Moat)

This is not a generic bookkeeper with an Urdu font bolted on.

| Payment format Munshi reads natively | |
|---|---|
| Meezan / HBL | Transfer SMS, app screenshot, statement PDF |
| Easypaisa / JazzCash | Payment confirmation screenshot, SMS-forward |
| Payoneer / Wise | Payment confirmation email, statement PDF |
| Upwork / Fiverr | Payout notification, revenue summary |
| WhatsApp | Screenshot or forwarded message with an amount |

No Western tool (QuickBooks, Wave, FreshBooks) understands any of these — they assume a Western bank account, a developer's patience for setup, and a bookkeeping habit that doesn't exist here.

**Language:** Urdu, Roman Urdu, and English throughout — how young Pakistani freelancers actually text, not just how they'd fill out a form.

**FBR awareness, deliberately scoped, not advice:**
- Surfaces a non-filer flag with a plain-language explanation of why it costs them money
- Points to NTN registration and FBR's IRIS portal
- Surfaces common freelancer deduction categories (internet, platform fees, equipment, software) to raise with a CA
- **Deliberately not built:** full FBR tax-slab calculation or an exact rupee-owed figure — slabs change annually and this carries real legal risk without CA sign-off. The single non-filer flag is judged to carry most of the value with the least liability. Every tax-adjacent surface repeats the disclaimer, not just once.

---

## Security & Data Model

- **Row-Level Security (RLS)** enabled from the first migration, on every table — every query scoped to `user_id`, no "view all" path anywhere in the application layer. Non-negotiable regardless of build timeline.
- **Field-level encryption (AES-256-GCM)** on sensitive columns — amounts, client names, raw transaction descriptions — unreadable even in a raw data export.
- **No standing admin access** — the internal team's own dashboard shows platform metrics, not individual ledgers, by default.
- **Audited, consent-based support access** — the only path to a user's raw data is time-boxed, logged, and tied to a specific support need.

Core tables: `users`, `transactions` (amount, currency, pkr_amount, exchange_rate, source, category, raw_file_url), `merchant_cache` (pattern → category, the caching layer above), `invoices` / `clients` (the "who owes me" tracker), `categories` (with FBR-category mapping).

---

## Build Status

*(Update this section immediately before pushing — mark only what's confirmed working in this exact commit.)*

**Confirmed shipped:**
- [x] Authentication — login, signup, session handling
- [x] Supabase schema with RLS enabled from the first migration
- [x] Transactions linked to clients (migration `0003`)
- [x] Generated Supabase types wired into client factories

**In progress / confirm before demo:**
- [ ] Upload → Claude vision extraction → ledger write
- [ ] Dashboard rendering live transaction data
- [ ] Non-filer flag calculation
- [ ] `merchant_cache` + Claude Haiku fallback categorization
- [ ] Multi-currency conversion (ExchangeRate-API)

**Documented, deliberately deferred (shown honestly as "Coming Soon" in-product, never hidden):**
- Gmail OAuth ingestion (read-only, payment-domain scoped)
- JazzCash SMS-forward parsing
- WhatsApp quick-logging free-text parsing
- Full FBR tax-slab calculation (out of scope indefinitely — legal risk without CA sign-off)
- Staff roles / superadmin dashboard wired to real aggregate data

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | Next.js (App Router) | One deployment, no cold-start risk on a live demo |
| Database | Supabase (Postgres) | Auth + storage + DB in one place, RLS built in |
| AI — extraction | Claude (vision) | Reads messy, mixed-language Pakistani payment formats without a separate OCR pipeline |
| AI — categorization fallback | Claude Haiku | Cheap, called only on cache misses |
| AI — escalation (planned) | Claude Sonnet | Harder cases once there's paying usage to justify it |
| Currency | ExchangeRate-API | Historical rates, free tier sufficient at pilot scale |
| Deployment | Vercel | One-click deploy, no cold starts |

**Cost at pilot scale:** cache-first design means most transactions never trigger an LLM call. Paid infrastructure (Sonnet escalation, paid document-AI, paid WhatsApp Business tier) is an explicit Phase 2 decision, made only once there's real paying usage — not a cost the MVP has to carry to prove the idea works.

---

## Who It's For

**Phase 1 — Freelancers** ($300–$5,000/month via Payoneer, Wise, direct transfer): income already arrives digital, so the core ledger + categorization + summary loop can be proven before any OCR/receipt-photo work is needed.

**Phase 1.5 — Small shop / social-commerce owners**: run the business on a notebook, memory, or WhatsApp; don't know who owes them; can't afford an accountant. Same engine, adds receipt-photo ingestion.

**Phase 2 — Platform / B2B**: verified income history licensed to lenders and fintechs — a high-margin layer once the core ledger has real usage behind it.

---

## Business Model

| Plan | Price | Includes |
|---|---|---|
| **Free** | $0 | ~20 transactions/month — enough to prove the value before paying |
| **Pro** | $12/month (USD-primary, PKR shown alongside) | Unlimited uploads, full history, FBR awareness module |
| **Teams** | $25/month | Everything in Pro + multi-user, shared merchant cache benefits |

USD-primary pricing reflects that the Phase 1 segment (freelancers) is paid in USD, not PKR — pricing shown in their own currency rather than forcing a mental conversion.

---

## Why This Wins

| Criteria | Munshi |
|---|---|
| Real, sharp, underserved problem | Yes — 2.3M+ freelancers, $1.76B in export earnings, zero tools built for this payment reality |
| Technical depth beyond "AI wrapper" | Yes — cache-first cost architecture, historical multi-currency conversion, RLS + field-level encryption, legally-scoped tax module |
| Market specificity (moat) | Yes — no Western tool reads Meezan/JazzCash/Payoneer formats or ships Urdu-first |
| Financial inclusion impact | Yes — turns informal, undocumented income into a structured record that can eventually support credit and loan access |
| Scalable | Yes — freelancers → shopkeepers → platform/B2B, same core engine |
| Responsible AI scoping | Yes — deliberately declined to build a full tax calculator; awareness over advice, everywhere |

---

## Team

**Marriyam Andeel** — Co-Founder. BS Artificial Intelligence, COMSATS Lahore. Hands-on across product and engineering.
📧 marriyamandeel07@gmail.com · [linkedin.com/in/marriyam-andeel](https://linkedin.com/in/marriyam-andeel)

**Amna Kousar** — Co-Founder. BS Artificial Intelligence, COMSATS Lahore. Hands-on across product and engineering.
📧 amnakousarbandesha@gmail.com · [linkedin.com/in/amna-kousar](https://linkedin.com/in/amna-kousar)

We build side by side: one of us ships a feature, the other tests it end-to-end and pushes back, then we swap. Every milestone in this repo passed through that loop.

---

## Full Documentation

Detailed design docs live in [`/docs`](./docs):
- `01-overview.md` — product overview and scope
- `02-architecture.md` — full system design, build-now vs. coming-soon
- `03-categorization-and-ai-behavior.md` — categorization logic, LLM usage, FBR scope
- `04-database-schema.md` — data model, RLS, access control design
- `05-setup.md` — local development setup
- `06-roadmap-and-limitations.md` — honest status of what's shipped vs. designed

---

*This is an organizing and awareness tool. Munshi does not file taxes and does not give certified financial or legal advice. Consult a CA for official filing.*
