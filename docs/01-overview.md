# Munshi — Product Overview

## What is Munshi?

Munshi is an AI bookkeeping agent for Pakistani freelancers and small business owners. It turns scattered financial records — Payoneer/Wise statements, bank transfers, receipts, WhatsApp invoice screenshots — into a clean running ledger, plain-language monthly summaries (Urdu/English), and a tax-time export. No accounting knowledge required.

Working title during early development was **FreelanceBook**, then **Shoebox-to-Books**; the product ships under the name **Munshi** ("bookkeeper" / "accountant's clerk" in Urdu).

## Who is it for?

Two segments share the same underlying problem — *"I don't actually know how much money I made, or where it went"* — for different reasons:

- **Segment A — Freelancers & IT/creative exporters** (Phase 1, where the product starts): paid in USD across Payoneer, Wise, and direct bank transfer; lose money to conversion spreads and fees they never track; uncertain how to file under FBR's export-income regime.
- **Segment B — Small shop / social-commerce owners** (Phase 1.5): run the business on a notebook, memory, or WhatsApp chat; don't know who owes them money; can't afford an accountant.

Phase 1 deliberately starts with freelancers because their income arrives already digital — no OCR needed to prove the core ledger + categorization + summary loop before adding receipt-photo ingestion.

## Core problem it solves

- No single view of real PKR take-home after multi-rail fees and currency-conversion loss
- No structured record of who owes what, or what was actually spent
- Confusion and dread around FBR filing, with no organized records to hand to a CA (or file directly)
- Existing tools (QuickBooks, Wave, FreshBooks) assume Western payment rails and accounting literacy neither segment has

## Core MVP Scope

Munshi is architected around an end-to-end automated bookkeeping loop. The MVP focuses on proving the primary financial extraction and reconciliation path while establishing the database and security foundation for full scale.

**The Core MVP Loop:**

```text
User uploads a payment screenshot / PDF
           ↓
Multimodal Vision LLM extracts amount, currency, date, sender, type
           ↓
One clarifying question if a field is unclear
           ↓
Saved to the ledger (Supabase Postgres, RLS enforced)
           ↓
Dashboard shows: this month's total (PKR), non-filer flag, transaction list
```

Extended modules — Gmail OAuth ingestion, JazzCash SMS-forward, WhatsApp quick-logging, merchant-cache categorization, per-tenant field encryption, and a live superadmin dashboard — represent planned architectural expansions shown as **"Coming Soon"** in the UI.

## What Munshi does (full designed product, not all built yet)

- Ingests income and expenses from statement uploads, receipt photos, Gmail (read-only, payment-domain scoped), JazzCash SMS-forward, and WhatsApp messages
- Categorizes automatically — rules and a merchant cache first, an LLM only for new/ambiguous transactions
- Maintains one running, correctable ledger per user
- Tracks unpaid client invoices ("who owes me")
- Produces a monthly plain-language summary: earned, spent, kept
- Produces a tax-time export formatted to FBR filing categories — explicitly an **organizing tool, not filed tax advice**

## Team & Recognition

Built by **Marriyam Andeel** and **Amna Kousar** (BS Artificial Intelligence, COMSATS University Islamabad, Lahore Campus)[cite: 6]. Originated as a submission to the Alibaba Cloud AI Hackathon Pakistan 2026 (Financial Inclusion track), accepted into WBIC (Women Business Incubation Center, NIC Lahore), and pitched to the Maryam Nawaz Women Incubator for Start-ups.

## Project status

The repository is actively built and version-controlled. Core database migrations (`0001`–`0003`), RLS policies, type generation, authentication proxy handling, and dashboard shells are shipped and verified[cite: 4]. See `06-roadmap-and-limitations.md` for current progress and active deliverables.

## Related docs in this folder

- `02-architecture.md` — system design: what's built now vs. Coming Soon
- `03-categorization-and-ai-behavior.md` — categorization decisions, LLM usage, FBR-awareness scope, cost approach[cite: 6]
- `04-database-schema.md` — data model, roles, RLS design
- `05-setup.md` — local dev setup
- `06-roadmap-and-limitations.md` — build status and roadmap