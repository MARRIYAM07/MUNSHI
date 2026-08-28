# Munshi — Architecture

## Overview

Munshi is a single Next.js (App Router) application deployed on **Vercel**, backed by **Supabase (Postgres)**.

This document is divided into two clearly defined scopes:

* 🟢 **Build Now** — functionality being implemented and demonstrated in the current MVP.
* 🔵 **Designed, Not Yet Built (Coming Soon)** — functionality that belongs to Munshi's broader product architecture and roadmap but is not yet wired to live functionality.

This distinction is intentional. Munshi is being developed as a **real product with plans for commercialization**, while also being presented through the **Alibaba Cloud Hackathon 2026 — Financial Inclusion Track** and having been **presented and accepted at the Women Business Incubator Center (WBIC)**.

The architecture therefore separates what the current product actually ships from the larger system Munshi is designed to become.

```text
BUILD NOW                              COMING SOON

┌─────────────┐     ┌──────────┐       ┌──────────────┐  ┌───────────┐
│  Manual     │ ──▶ │ Claude   │       │  Gmail OAuth │  │ JazzCash  │
│  upload     │     │ Vision   │       │  ingestion   │  │ SMS-fwd   │
│ (screenshot/│     │ extract  │       └──────────────┘  └───────────┘
│  PDF)       │     └────┬─────┘       ┌──────────────┐  ┌───────────┐
└─────────────┘          ▼              │ merchant_cache│  │ WhatsApp  │
                   ┌────────────┐       │ + rules layer │  │ logging   │
                   │ Ledger (DB)│       └──────────────┘  └───────────┘
                   └─────┬──────┘
                         ▼
             ┌────────────────────┐
             │ Dashboard: monthly │
             │ total + non-filer  │
             │ awareness flag     │
             └────────────────────┘
```

---

## Frontend

### 🟢 Build Now

* Next.js **App Router**
* Deployment on **Vercel**
* Core pages:

  * Landing
  * Login
  * Signup
  * Upload
  * Dashboard
* Munshi's visual language is based on a ledger/khata-inspired theme:

  * Forest green
  * Red ink
  * Brass
  * Paper tones
  * IBM Plex typography

The MVP intentionally prioritizes a clear and usable workflow over unnecessary interface complexity.

Any functionality that is planned but not yet operational may be represented through a clearly labeled **Coming Soon** UI element rather than being presented as functional.

This allows the product to communicate its broader vision without overclaiming current capabilities.

### 🔵 Coming Soon

* Superadmin dashboard with aggregate/metadata views
* Client and invoice tracker
* Staff management
* Expanded financial-management views
* Additional product modules as the commercial roadmap develops

A Superadmin page may be represented in the UI as a realistic **Coming Soon** experience before its backend service is implemented.

---

## Backend / API

### 🟢 Build Now

Munshi uses Next.js API routes within the same Vercel deployment.

The primary ingestion endpoint is:

```text
/api/upload
```

The upload flow is:

```text
User Upload
     ↓
/api/upload
     ↓
Claude Vision
     ↓
Structured JSON
     ↓
Validation
     ↓
Categorization Rules
     ↓
Supabase Ledger
```

The API is responsible for:

1. Receiving the uploaded screenshot or PDF.
2. Passing the document to Claude's multimodal vision capability.
3. Parsing the structured response.
4. Validating the extracted transaction data.
5. Applying the MVP categorization rules.
6. Writing the validated transaction to Supabase.

Keeping this workflow within the Next.js application provides a simple deployment model while maintaining a clear path toward future background processing.

---

## Database

### 🟢 Build Now

Munshi uses **Supabase PostgreSQL**.

The MVP database contains the core entities required for the bookkeeping workflow:

```text
users
transactions
clients
```

`clients` may be expanded as client-management functionality develops.

### Row-Level Security

**Row-Level Security (RLS) is enabled from the first database migration.**

This is a fundamental security requirement because Munshi handles financial information.

Every user's data is strictly scoped to their authenticated `user_id`.

Conceptually:

```text
User A ──► User A's transactions
User B ──► User B's transactions
User C ──► User C's transactions
```

No user should be able to query another user's financial records.

### 🔵 Coming Soon

The broader database architecture includes:

```text
merchant_cache
invoices
categories
```

with additional category metadata such as:

```text
fbr_mapping
```

Future security architecture may include:

* Field-level / per-column encryption
* Per-tenant key management
* More granular role permissions
* Stronger separation between tenant data and administrative metadata

See `04-database-schema.md` for the detailed database design.

---

## Ingestion Sources

Munshi's long-term ingestion architecture is designed around the reality that financial information is distributed across multiple platforms.

| Source                  | Status           | Method                            |
| ----------------------- | ---------------- | --------------------------------- |
| Screenshot / PDF upload | 🟢 **Build Now** | Manual upload → Claude Vision     |
| Bank statements         | 🔵 Coming Soon   | Manual upload + parser            |
| Payoneer statements     | 🔵 Coming Soon   | CSV / statement parser            |
| Wise statements         | 🔵 Coming Soon   | CSV / statement parser            |
| Gmail                   | 🔵 Coming Soon   | Read-only OAuth                   |
| JazzCash                | 🔵 Coming Soon   | SMS forwarding                    |
| WhatsApp quick-logging  | 🔵 Coming Soon   | Free-text message parsing         |
| Receipts                | 🔵 Coming Soon   | Photo upload                      |
| Client / invoice data   | 🔵 Coming Soon   | Structured entry and integrations |

The long-term goal is to make Munshi compatible with the different ways Pakistani freelancers and small businesses actually receive, send, and record money.

---

## Categorization

### 🟢 Build Now

Claude Vision extracts core transaction information directly during upload, including:

* Amount
* Currency
* Date
* Sender
* Transaction type

A lightweight deterministic rule layer then applies categories on top of the extraction.

For example:

```text
Payoneer ──┐
Upwork   ──┼──► Freelance Income
Fiverr   ──┘
```

The MVP does **not** require a separate merchant-cache system.

### 🔵 Coming Soon

The fuller categorization architecture introduces a **merchant-cache-first** approach:

```text
Transaction
     ↓
merchant_cache
     ↓
 ┌───┴────┐
 │        │
Match   No Match
 │        │
 ▼        ▼
Category Claude
          │
          ▼
       Category
          │
          ▼
   Cache the result
```

The planned system will:

1. Check deterministic rules and cached merchants first.
2. Use a lightweight LLM only when necessary.
3. Store useful classification results.
4. Allow user corrections.
5. Write corrected classifications back into the categorization layer.

This reduces unnecessary LLM calls and creates a system that becomes more efficient as transaction patterns accumulate.

Detailed behavior is documented in:

`03-categorization-and-ai-behavior.md`

---

## Roles and Dashboards

### 🟢 Build Now

The current product has a single primary role:

**Owner**

Each user can access only their own financial records.

```text
Owner
  │
  └──► Personal Ledger
```

RLS provides the database-level isolation required for this model.

No staff or administrative user has unrestricted access to individual customer ledgers in the current MVP.

### 🔵 Coming Soon

Future roles include:

```text
Owner
  │
  ├── Ledger
  ├── Clients
  ├── Invoices
  └── Staff
```

and a separate administrative layer:

```text
Superadmin
    │
    └── Aggregate / Metadata
             │
             ├── Product metrics
             ├── System information
             └── Non-sensitive operational data
```

The planned Superadmin architecture is intentionally separate from customer financial data.

The Superadmin service should query only the aggregate or metadata information it requires rather than providing unrestricted access to individual users' financial ledgers.

---

## Infrastructure

### 🟢 Build Now

The current deployment architecture uses:

| Component      | Technology                     |
| -------------- | ------------------------------ |
| Application    | Next.js                        |
| Hosting        | Vercel                         |
| Database       | Supabase PostgreSQL            |
| Authentication | Supabase Auth                  |
| AI / Vision    | Anthropic Claude               |
| Ingestion      | Manual screenshot / PDF upload |

The current infrastructure is intentionally lightweight and suitable for MVP validation and product demonstrations.

### 🔵 Coming Soon

As Munshi moves toward larger-scale commercial deployment, the infrastructure can expand to include:

* Vercel Pro
* Supabase Pro
* Claude model escalation
* Dedicated document-AI / OCR where appropriate
* Background job queues
* Paid WhatsApp Business infrastructure / BSP
* Asynchronous ingestion processing
* More robust monitoring and observability
* Production-grade security and key-management infrastructure

The goal is to scale infrastructure according to actual product usage rather than introducing unnecessary complexity before it is required.

---

## AI Architecture

Munshi currently uses a **single AI provider: Anthropic Claude**.

This simplifies the system while maintaining multimodal document understanding for the current ingestion workflow.

### Current Flow

```text
Screenshot / PDF
       ↓
Claude Vision
       ↓
Structured Transaction
       ↓
Validation
       ↓
Rule-based Categorization
       ↓
Supabase
```

### Future Flow

```text
Screenshot / PDF
       ↓
Claude Vision
       ↓
Validation
       ↓
Merchant Cache / Rules
       ↓
 ┌─────┴─────┐
 │           │
Known      Unknown
 │           │
 ▼           ▼
Category   LLM Fallback
             │
             ▼
          Category
             │
             ▼
       Merchant Cache
             │
             ▼
          Supabase
```

Future model routing may use different Claude models depending on transaction complexity, cost, and confidence.

---

## Financial Data Model

Munshi is designed around the financial realities of its primary user segment.

Many Pakistani freelancers:

* Earn internationally
* Receive payments in USD
* Spend primarily in PKR
* Use multiple payment platforms
* Maintain records across different applications

Munshi therefore follows a **USD-primary with PKR alongside** approach.

A transaction can conceptually contain:

```text
Original Amount
       +
Original Currency
       +
Exchange Rate
       +
PKR Equivalent
       +
Transaction Date
```

Historical exchange rates should be used for historical transaction conversion rather than automatically applying today's exchange rate to old transactions.

---

## Tax & Filer Awareness

Munshi may provide financial awareness around Pakistan's filer/non-filer system.

### 🟢 Build Now

The MVP dashboard can surface a clearly labeled **non-filer awareness flag**.

### 🔵 Coming Soon

The broader product may provide:

* More detailed filer awareness
* FBR-related category mappings
* Expense organization
* Freelancer-specific financial summaries
* Links to official tax resources
* Better preparation of records for professional tax consultation

Munshi is **not intended to replace a Chartered Accountant or provide certified tax advice**.

Tax-related functionality should remain informational unless and until appropriate professional and regulatory requirements are addressed.

---

## Security & Privacy

Financial data requires strict tenant isolation.

Munshi therefore treats security as an architectural requirement rather than a future feature.

### Current protections

* Supabase authentication
* Row-Level Security
* User-scoped database access
* Server-side API processing
* Structured validation before database writes
* Secrets stored through environment variables
* No API credentials committed to source control

### Future protections

* Field-level encryption
* Per-tenant encryption keys
* More granular permissions
* Secure background processing
* Enhanced audit logging
* Production-grade secrets and key management

---

## Commercial Product Architecture

Munshi is designed to evolve beyond the initial MVP.

The architecture supports a progression from:

```text
MVP
 ↓
Product Validation
 ↓
Incubation
 ↓
Commercial Product
 ↓
Scale
```

The current architecture intentionally avoids building every future service immediately.

Instead, the system establishes a strong core:

```text
Ingestion
   ↓
AI Understanding
   ↓
Structured Financial Data
   ↓
Ledger
   ↓
Financial Visibility
```

Additional ingestion channels, categorization intelligence, business-management features, and infrastructure can then be added around this core without replacing the underlying product model.

---

## Known Design Decisions

### 1. Multimodal Vision First

Munshi uses Claude's multimodal capabilities for screenshot and PDF understanding instead of maintaining separate OCR pipelines for every financial document format.

This reduces the number of brittle document-specific integrations required during the initial product stage.

### 2. Single AI Provider

Anthropic/Claude is used as the primary AI provider throughout the current architecture.

This reduces integration complexity and keeps the AI layer easier to maintain.

Model specialization and escalation can be introduced later when usage patterns justify it.

### 3. Rules Before LLM Where Possible

The MVP uses lightweight deterministic categorization rules.

The future architecture extends this into a merchant-cache-first system.

This helps control inference costs while improving consistency.

### 4. RLS From the Beginning

RLS is not treated as a later production hardening step.

It is part of the initial database architecture because financial data may be used during demonstrations, pilots, and product validation.

### 5. USD + PKR

USD is treated as the primary foreign-earning currency for the initial target segment, while PKR remains important for local financial visibility.

### 6. Visible Roadmap

Coming Soon functionality should remain visible and clearly labeled where appropriate.

Munshi intentionally avoids presenting planned architecture as though it is already operational.

---

## Architecture Principle

The core principle behind Munshi is:

> **Make financial bookkeeping adapt to the user's existing behavior instead of forcing the user to adapt to traditional bookkeeping software.**

That means:

```text
Messy real-world financial data
              ↓
        Munshi ingestion
              ↓
        AI understanding
              ↓
     Structured transaction
              ↓
       Intelligent ledger
              ↓
      Financial visibility
```

The current MVP proves the core of this loop.

The coming architecture is designed to make the loop increasingly **automated, intelligent, secure, and commercially scalable**.

---

## Scope Summary

| Area                            | Current MVP | Coming Soon |
| ------------------------------- | ----------- | ----------- |
| Next.js App Router              | 🟢          |             |
| Vercel deployment               | 🟢          |             |
| Supabase PostgreSQL             | 🟢          |             |
| Supabase Auth                   | 🟢          |             |
| RLS                             | 🟢          |             |
| Screenshot upload               | 🟢          |             |
| PDF upload                      | 🟢          |             |
| Claude Vision extraction        | 🟢          |             |
| Basic categorization rules      | 🟢          |             |
| Monthly dashboard               | 🟢          |             |
| Non-filer awareness             | 🟢          |             |
| Merchant cache                  |             | 🔵          |
| Advanced categorization         |             | 🔵          |
| Gmail OAuth                     |             | 🔵          |
| Bank statement parsing          |             | 🔵          |
| Payoneer / Wise ingestion       |             | 🔵          |
| JazzCash SMS forwarding         |             | 🔵          |
| WhatsApp logging                |             | 🔵          |
| Receipt ingestion               |             | 🔵          |
| Client management               |             | 🔵          |
| Invoice tracking                |             | 🔵          |
| Staff roles                     |             | 🔵          |
| Superadmin service              |             | 🔵          |
| Field-level encryption          |             | 🔵          |
| Per-tenant key management       |             | 🔵          |
| Background jobs                 |             | 🔵          |
| Advanced AI routing             |             | 🔵          |
| Production-scale infrastructure |             | 🔵          |
