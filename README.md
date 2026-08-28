# 📒 Munshi (منشی)

### AI Bookkeeping for Pakistan's Freelance Economy

> **"QuickBooks doesn't know what a Meezan transaction screenshot is. We do. That's the whole product."**

**Built for Pakistan. Designed to scale beyond it.**

---

## 🌱 From a Problem to a Product

Munshi started with a simple observation:

**Pakistan's freelancers are earning real money, but their financial records are often scattered across screenshots, bank apps, payment platforms, WhatsApp conversations, and memory.**

Traditional accounting software assumes that users will sit down and manually enter every transaction.

Munshi takes the opposite approach.

> **Your financial data already exists. Munshi turns it into a ledger.**

Munshi is being developed as a **commercial product**, not only as a hackathon prototype. The current MVP is focused on validating the core workflow while the broader architecture and roadmap are designed for a scalable product.

The project is also being presented through the **Alibaba Cloud Hackathon 2026 — Financial Inclusion Track** and has been **presented and accepted at the Women Business Incubator Center (WBIC)** for further development and commercialization.

---

# 👤 The Problem, In One Person

## Meet Hamza.

**Hamza is 24. He's a CS graduate freelancing on Upwork, earning $300–600/month from international clients.**

He's paid through **Payoneer**, into a **Meezan** account.

One client pays through **Wise**.

Another sends him a WhatsApp message:

> *"bhai account number do, transfer karta hun."*

A fourth client has owed him money for six weeks, and he keeps forgetting to follow up.

His "accounting system" is:

* A WhatsApp chat
* A screenshots folder he never opens
* His own memory

Ask Hamza what he earned last quarter and he'll spend two hours scrolling through receipts trying to calculate it — and probably get it wrong.

He doesn't have a clear picture of:

* How much he actually earned
* Where his money came from
* Who still owes him
* What his monthly income looks like
* How his transactions affect his tax situation

He's also a non-filer, paying higher withholding tax on bank transactions without necessarily understanding the financial impact.

### Hamza isn't an edge case.

He's representative of a much larger problem.

Pakistan's freelance economy is growing rapidly, yet many freelancers still manage their finances through fragmented records rather than dedicated bookkeeping systems built around their actual payment behavior.

**Munshi's real competitor isn't QuickBooks.**

**It's a WhatsApp note to self.**

That's what we're replacing.

---

# 💡 Our Solution

Munshi meets users where their financial data already exists.

Instead of forcing users to manually enter every transaction:

```text
Open accounting software
        ↓
Find transaction
        ↓
Read screenshot
        ↓
Manually type amount
        ↓
Enter date
        ↓
Enter currency
        ↓
Choose category
        ↓
Save
```

Munshi aims for:

```text
Upload / Forward
       ↓
    Munshi
       ↓
   AI reads it
       ↓
   Categorizes it
       ↓
    Saves it
       ↓
  Running ledger
```

The user shouldn't have to become an accountant just to keep accounting records.

---

# ⚙️ The Munshi Core Loop

```text
User uploads screenshot / PDF
            ↓
      Vision LLM extraction
            ↓
  amount • currency • date
  sender • transaction type
            ↓
      Structured validation
            ↓
       Categorization
            ↓
       Supabase Ledger
            ↓
         Dashboard
```

The broader product architecture extends this to additional ingestion channels:

```text
Gmail ─────────────┐
Payoneer ──────────┤
Wise ──────────────┤
Bank Statements ───┤
JazzCash ──────────┤
WhatsApp ──────────┤
Receipts ──────────┘
          ↓
    Unified Ingestion
          ↓
      Munshi AI
          ↓
       Ledger
```

---

# 🚀 Core MVP

The current MVP focuses on establishing the most important product loop:

**Upload → Understand → Categorize → Record → View**

### 🔐 Authentication

* Login
* Signup
* Session handling
* Supabase authentication

### 📸 Transaction ingestion

* Screenshot upload
* PDF upload
* Multimodal Vision LLM extraction

### 🤖 AI extraction

Munshi extracts structured transaction information including:

* Amount
* Currency
* Date
* Sender
* Transaction type

### 🏷️ Categorization

The MVP applies structured rules on top of AI extraction.

For example:

```text
Payoneer ──┐
Upwork   ──┼──► Freelance Income
Fiverr   ──┘
```

### 📒 Ledger

Validated transactions are stored in Supabase/Postgres and associated with the authenticated user.

### 📊 Dashboard

The Core MVP is designed to provide:

* Monthly total
* Transaction history
* Financial overview
* Non-filer awareness

### 🔒 Security

* Row-Level Security from the first migration
* User-scoped queries
* Server-side processing
* Structured validation before database writes

---

# 🧠 Why This Is Hard

Munshi is not simply:

> **"Add AI to a ledger."**

The underlying problem has several constraints that directly shape the architecture.

| Constraint                       | Why it matters                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| **Fragmented payment ecosystem** | Freelancers may receive money through Payoneer, Wise, bank transfers, JazzCash, or WhatsApp |
| **Messy financial records**      | Screenshots, PDFs, SMS messages, and informal messages vary widely                          |
| **Mixed language**               | Pakistani users may communicate in Urdu, Roman Urdu, and English                            |
| **Different formats**            | Financial institutions and payment platforms produce different transaction formats          |
| **Multi-currency income**        | International earnings need accurate historical currency conversion                         |
| **Tax complexity**               | Tax information must be presented carefully without pretending to replace a CA              |
| **AI cost**                      | Sending every transaction to an LLM indefinitely is not economically efficient              |
| **Financial privacy**            | Financial records require strong tenant isolation                                           |

These constraints aren't just product considerations.

**They drive the architecture.**

---

# 🏗️ Architecture

```text
                         MUNSHI
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼

    INGESTION          INTELLIGENCE         OUTPUT

┌───────────────┐   ┌────────────────┐   ┌────────────────────┐
│ Screenshot    │   │ Vision LLM     │   │ Dashboard          │
│ PDF           │──▶│ Extraction     │──▶│                    │
└───────────────┘   └───────┬────────┘   │ • Monthly total    │
                            │            │ • Transactions     │
┌───────────────┐           ▼            │ • Financial view   │
│ Gmail         │   ┌────────────────┐   │ • Non-filer flag   │
│ Coming Soon   │──▶│ Validation     │   │ • Future reminders │
└───────────────┘   └───────┬────────┘   └────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Categorization   │
                  │ Rules + Cache    │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Supabase /       │
                  │ PostgreSQL       │
                  │                  │
                  │ Auth + RLS       │
                  └──────────────────┘
```

---

# 🏛️ Application Architecture

Munshi uses a **single Next.js App Router application**.

```text
┌──────────────────────────────────────┐
│           Next.js Application        │
│                                      │
│  Frontend                            │
│  ├── Landing                         │
│  ├── Login                           │
│  ├── Signup                          │
│  ├── Upload                          │
│  └── Dashboard                       │
│                                      │
│  Backend                             │
│  └── /api/upload                     │
│                                      │
└───────────────┬──────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐   ┌─────────────────┐
│   Supabase   │   │ Multimodal AI   │
│  PostgreSQL  │   │                 │
│  Auth + RLS  │   │ Extraction      │
└──────────────┘   └─────────────────┘
```

The MVP intentionally keeps frontend and API routing within one deployment.

---

# 📥 Ingestion

## 🟢 Build Now

| Source     | Method                     |
| ---------- | -------------------------- |
| Screenshot | Manual upload + Vision LLM |
| PDF        | Manual upload + Vision LLM |

## 🔵 Coming Soon

| Source          | Planned Method         |
| --------------- | ---------------------- |
| Bank statements | CSV parser             |
| Payoneer        | CSV / statement parser |
| Wise            | CSV / statement parser |
| Gmail           | Read-only OAuth        |
| JazzCash        | SMS forwarding         |
| WhatsApp        | Free-text parsing      |
| Receipts        | Photo upload           |

The long-term goal is to let users bring their financial information into Munshi **without changing how they already receive payments.**

---

# 🏷️ AI Categorization

## Current approach

The MVP combines multimodal extraction with structured categorization rules.

Example:

```text
Transaction
    ↓
Extract source
    ↓
Known pattern?
    ↓
Yes ──► Deterministic category
```

For example:

```text
Payoneer
Upwork
Fiverr
       ↓
Freelance Income
```

---

# 💰 The Margin Lever: Merchant Cache

A major part of Munshi's future architecture is keeping AI costs under control.

A naive system could do this:

```text
Transaction
    ↓
LLM
    ↓
Category
```

for every transaction.

Munshi instead plans a cache-first system:

```text
Transaction
      ↓
merchant_cache
      ↓
 ┌────┴────┐
 │         │
Match    No Match
 │         │
 ▼         ▼
Category  LLM
           │
           ▼
        Category
           │
           ▼
     Save to cache
```

Once a merchant or transaction pattern is understood, future transactions can be categorized deterministically.

This creates an architecture where:

**More usage can improve categorization efficiency instead of linearly increasing AI inference requirements.**

---

# 🔄 User Corrections

The future categorization system is designed to learn from corrections.

```text
AI says:
"Software"

      ↓

User corrects:
"Business Expense"

      ↓

Correction stored

      ↓

Future matching transactions
can use the corrected category
```

This turns user feedback into a long-term product asset.

---

# 🇵🇰 Built for Pakistan

Munshi is not a generic accounting product with localization added later.

The product is designed around Pakistan's actual financial ecosystem.

Potential sources include:

* Meezan
* HBL
* Easypaisa
* JazzCash
* Payoneer
* Wise
* Upwork
* Fiverr
* Direct bank transfers
* WhatsApp payment conversations

The goal is to understand the **real financial trail of a Pakistani freelancer**.

---

# 🌐 Language Reality

Pakistani financial communication isn't always written in formal English.

Users may write:

* English
* Urdu
* Roman Urdu
* Mixed Urdu-English

For example:

> "bhai payment receive ho gai hai"

or:

> "client ny 500 dollar send kr diye"

Munshi's long-term ingestion architecture is designed to accommodate this reality rather than requiring users to translate their financial information into formal accounting language.

---

# 💱 Multi-Currency

Many Pakistani freelancers earn in USD while spending and reporting in PKR.

Munshi therefore uses a:

**USD-primary + PKR alongside** approach.

The intended transaction model preserves:

```text
Original Amount
       +
Original Currency
       +
Historical Exchange Rate
       +
PKR Equivalent
```

This avoids treating historical transactions as though they happened at today's exchange rate.

---

# 🧾 FBR Awareness

Munshi treats tax functionality as **financial awareness, not tax advice**.

The product may surface:

* Non-filer awareness
* Why filer status can matter
* Links toward official FBR resources
* Common freelancer deduction categories

Potential categories include:

* Internet
* Software
* Equipment
* Platform fees

### Munshi does NOT attempt to:

* Replace a Chartered Accountant
* Provide certified tax advice
* Guarantee tax liability calculations
* File taxes on behalf of the user

Tax rules can change.

The product therefore prioritizes **awareness and organization** over pretending to provide professional tax services.

---

# 🔐 Security & Privacy

Financial data is sensitive.

Security is therefore part of the architecture from the beginning.

## Row-Level Security

RLS is enabled from the first migration.

Every user's transaction access is scoped to their own `user_id`.

```text
User A
   │
   └──► User A's Ledger

User B
   │
   └──► User B's Ledger
```

A user should never be able to access another user's financial records.

## Planned Security

The fuller product architecture includes:

* Field-level encryption
* Per-tenant key management
* More granular permissions
* Stronger separation between tenant and administrative data

---

# 🗄️ Database

## Core MVP

```text
users
  │
  ├── transactions
  │
  └── clients
```

## Planned Extended Schema

```text
users
  │
  ├── transactions
  ├── clients
  ├── invoices
  ├── categories
  └── merchant_cache
```

### Core transaction information

Transactions are designed around information such as:

```text
amount
currency
pkr_amount
exchange_rate
date
source
category
sender
transaction_type
user_id
raw_file_url
```

---

# 👥 Roles

## 🟢 Current MVP

The current product focuses on one role:

```text
Owner
  │
  └──► Own Ledger
```

RLS ensures that each user accesses only their own records.

## 🔵 Coming Soon

```text
                    Superadmin
                        │
                Aggregate Metrics
                        │
                        │
Owner ──────────────────┼──────────────┐
 │                      │              │
 ▼                      ▼              ▼
Ledger                Clients        Staff
                         │
                         ▼
                      Invoices
```

The future Superadmin architecture is intended to operate around aggregate and metadata information rather than unrestricted access to individual financial ledgers.

---

# 💼 Product & Business Model

Munshi is being built with commercialization in mind.

The initial target market is:

### Phase 1 — Freelancers

Freelancers earning approximately **$300–$5,000/month** through:

* Upwork
* Fiverr
* Payoneer
* Wise
* Direct clients
* Bank transfers

### Phase 1.5 — Small Businesses

Small businesses and social-commerce sellers who currently depend on:

* Notebooks
* WhatsApp
* Memory
* Informal records

### Phase 2 — Financial Ecosystem

With enough structured financial history, Munshi could eventually support integrations with:

* Fintech platforms
* Lending providers
* Financial services
* Business tools

The long-term vision is not to become a bank.

It is to become the **financial record layer** that makes informal income more visible and useful.

---

# 💵 Planned Pricing

| Plan      |     Price | Intended Features                             |
| --------- | --------: | --------------------------------------------- |
| **Free**  |        $0 | Limited monthly transactions                  |
| **Pro**   | $12/month | Unlimited uploads, history, advanced features |
| **Teams** | $25/month | Multi-user functionality                      |

Pricing will be validated against actual user behavior and willingness to pay during product development.

---

# 🌱 Financial Inclusion

Munshi's broader purpose goes beyond bookkeeping convenience.

Many freelancers have genuine income but fragmented financial records.

Today:

```text
Income
  ↓
Screenshots
SMS
WhatsApp
Payment platforms
Memory
  ↓
Fragmented financial history
```

With Munshi:

```text
Income
  ↓
Munshi
  ↓
Structured ledger
  ↓
Financial history
  ↓
Greater financial visibility
```

Over time, structured financial history could help users become more legible to the formal financial ecosystem.

That creates potential for future access to products such as financing and other financial services.

---

# 🎯 Why Munshi?

| Problem                          | Munshi's Approach                            |
| -------------------------------- | -------------------------------------------- |
| Financial data is scattered      | Bring it into one ledger                     |
| Manual bookkeeping is tedious    | AI-powered extraction                        |
| Payment formats differ           | Multimodal document understanding            |
| Merchants repeat                 | Cache-first categorization                   |
| Users communicate informally     | Designed for local language patterns         |
| Freelancers earn internationally | USD + PKR handling                           |
| Tax information is confusing     | Awareness without pretending to replace a CA |
| Financial data is sensitive      | RLS from the first migration                 |
| AI can become expensive          | Deterministic cache + targeted LLM usage     |

---

# 🏆 Validation & Product Journey

Munshi is being developed through multiple validation environments.

## 🚀 Alibaba Cloud Hackathon 2026

Munshi is being presented in the:

**Financial Inclusion Track**

The hackathon provides an opportunity to demonstrate the technology, validate the product concept, and receive feedback from technical and business evaluators.

## 🌸 Women Business Incubator Center (WBIC)

Munshi has also been **presented and accepted at WBIC — Women Business Incubator Center**.

This provides a pathway for further product development, business validation, mentorship, and commercialization.

### Our direction

```text
Problem Identification
        ↓
       MVP
        ↓
Hackathon Validation
        ↓
     WBIC
        ↓
Product Validation
        ↓
Commercialization
        ↓
Market Expansion
```

The hackathon is therefore **one milestone in Munshi's journey, not the destination.**

---

# 🚧 Build Now vs. Coming Soon

We are deliberately transparent about the distinction between current functionality and planned functionality.

## 🟢 Build Now

Functionality that is currently being implemented, tested, or demonstrated as part of the Core MVP.

## 🔵 Coming Soon

Functionality that belongs to Munshi's broader product architecture and roadmap but is not yet wired to live functionality.

We would rather show a clearly labeled **Coming Soon** feature than claim something that doesn't work.

This distinction matters because Munshi is being built as a **real commercial product**.

The roadmap represents where the product is going — not functionality we are pretending already exists.

---

# 📊 Current MVP Status

> **This section should be updated before every public demo or submission to reflect the exact state of the repository.**

### 🟢 Core

* [x] Next.js App Router application
* [x] Authentication
* [x] Login
* [x] Signup
* [x] Supabase database
* [x] RLS migrations
* [x] User-scoped data model
* [x] Client / transaction relationships

### 🚧 Core Workflow

* [ ] Upload → Vision LLM → ledger write
* [ ] Live dashboard transaction rendering
* [ ] Non-filer awareness
* [ ] Merchant cache categorization
* [ ] Historical currency conversion

### 🔵 Coming Soon

* [ ] Gmail OAuth
* [ ] Bank CSV ingestion
* [ ] Payoneer CSV ingestion
* [ ] Wise CSV ingestion
* [ ] JazzCash SMS forwarding
* [ ] WhatsApp quick logging
* [ ] Receipt-photo ingestion
* [ ] Staff roles
* [ ] Invoice management
* [ ] Superadmin aggregate dashboard
* [ ] Field-level encryption
* [ ] Per-tenant key management
* [ ] Background job queues
* [ ] AI model escalation

---

# 🗺️ Roadmap

## Phase 1 — Core MVP 🟢

**Goal:** Prove the core bookkeeping loop.

```text
Upload
  ↓
AI Extraction
  ↓
Validation
  ↓
Categorization
  ↓
Ledger
  ↓
Dashboard
```

---

## Phase 1.5 — Small Business Expansion 🔵

* Receipt-photo ingestion
* Staff accounts
* Client management
* Invoice tracking
* Merchant cache
* User correction feedback

---

## Phase 2 — Automated Ingestion 🔵

* Gmail OAuth
* Bank statements
* Payoneer
* Wise
* JazzCash
* WhatsApp

---

## Phase 3 — Scale 🔵

* Background processing
* Advanced AI routing
* Sonnet/Qwen-Max escalation
* Field-level encryption
* Per-tenant key management
* Dedicated WhatsApp Business infrastructure
* Separate Superadmin service

---

# 🛠️ Tech Stack

| Layer             | Technology                       |
| ----------------- | -------------------------------- |
| Frontend          | Next.js App Router               |
| Backend           | Next.js API Routes               |
| Database          | Supabase PostgreSQL              |
| Authentication    | Supabase Auth                    |
| AI Extraction     | Multimodal Vision LLM            |
| AI Categorization | Lightweight LLM + merchant cache |
| Currency          | Historical exchange-rate API     |
| Deployment        | Cloud hosting                    |

---

# 📁 Project Structure

```text
munshi/
│
├── app/
│   ├── login/
│   ├── signup/
│   ├── upload/
│   ├── dashboard/
│   ├── api/
│   │   └── upload/
│   └── page.tsx
│
├── components/
│   ├── dashboard/
│   ├── upload/
│   ├── ui/
│   └── layout/
│
├── lib/
│   ├── supabase/
│   ├── ai/
│   └── utils/
│
├── supabase/
│   └── migrations/
│       ├── 0001_*.sql
│       ├── 0002_*.sql
│       └── 0003_*.sql
│
├── public/
│
├── docs/
│
├── README.md
├── package.json
└── .env.local
```

---

# 🚀 Getting Started

## Prerequisites

You'll need:

* Node.js
* npm / pnpm / yarn
* Supabase project
* Required AI API credentials
* Exchange-rate API credentials if currency conversion is enabled

## Installation

```bash
git clone <repository-url>
cd munshi
npm install
```

Create your environment file:

```bash
cp .env.example .env.local
```

Add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

VISION_LLM_API_KEY=

EXCHANGERATE_API_KEY=
```

> **Never commit API keys, service-role keys, or other secrets to the repository.**

## Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 MVP Development Flow

```text
1. User signs up
        ↓
2. User uploads screenshot / PDF
        ↓
3. /api/upload receives file
        ↓
4. Vision LLM extracts transaction
        ↓
5. JSON schema validation
        ↓
6. Categorization rules
        ↓
7. Supabase transaction insert
        ↓
8. Dashboard retrieves user's ledger
        ↓
9. User sees financial overview
```

---

# 📚 Documentation

Detailed architecture documentation is available in the `/docs` directory.

Recommended documents include:

| Document                               | Description                    |
| -------------------------------------- | ------------------------------ |
| `01-overview.md`                       | Product overview and scope     |
| `02-architecture.md`                   | System architecture            |
| `03-categorization-and-ai-behavior.md` | AI behavior and categorization |
| `04-database-schema.md`                | Database and RLS design        |
| `05-setup.md`                          | Development setup              |
| `06-roadmap-and-limitations.md`        | Roadmap and limitations        |

---

# 👩‍💻 Team

## Marriyam Andeel

**Co-Founder**

BS Artificial Intelligence
COMSATS University Islamabad — Lahore Campus

📧 **[marriyamandeel07@gmail.com](mailto:marriyamandeel07@gmail.com)**
🔗 LinkedIn: **[linkedin.com/in/marriyam-andeel](https://linkedin.com/in/marriyam-andeel)**

---

## Amna Kousar

**Co-Founder**

BS Artificial Intelligence
COMSATS University Islamabad — Lahore Campus

📧 **[amnakousarbandesha@gmail.com](mailto:amnakousarbandesha@gmail.com)**
🔗 LinkedIn: **[linkedin.com/in/amna-kousar](https://linkedin.com/in/amna-kousar)**

---

### 🤝 How We Build

We build side by side.

One of us ships a feature, the other tests it end-to-end and pushes back — then we swap.

The goal is simple:

**Build fast. Test honestly. Improve continuously.**

---

# 📬 Contact

For collaboration, partnerships, incubation, investment, or product feedback:

📧 **[marriyamandeel07@gmail.com](mailto:marriyamandeel07@gmail.com)**
📧 **[amnakousarbandesha@gmail.com](mailto:amnakousarbandesha@gmail.com)**

---

# 🔭 The Vision

Munshi starts with a simple problem:

> **A freelancer has a payment screenshot and doesn't want to manually turn it into accounting data.**

But the long-term vision is much bigger.

We want Munshi to become the **financial memory layer for Pakistan's informal and freelance economy**.

A place where financial information from:

```text
Banks
Payment platforms
WhatsApp
Gmail
Receipts
Invoices
```

can eventually come together into one understandable financial history.

From:

> **"Where did my money go?"**

to:

> **"Munshi already knows."**

---

# ⚠️ Disclaimer

Munshi is an **organizing and financial-awareness product**.

It does not:

* File taxes
* Replace a Chartered Accountant
* Provide certified financial advice
* Provide certified legal advice

Tax-related information is intended for awareness and should be verified with a qualified professional.

**Consult a CA for official tax filing and professional advice.**

---

# 📜 License

Add the project's license here.

---

## 🧾 Munshi

**From screenshots, statements, and scattered messages — to one financial ledger.**

**Built for Pakistan. Built to grow.**
