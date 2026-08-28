Munshi — Database Schema

Munshi uses Supabase (Postgres) as its database.

The Supabase database has already been created and integrated with the Munshi application. The schema below distinguishes between functionality that is part of the current 4-day repository/build and functionality designed for the fuller product architecture.

Tables are tagged as:

🟢 Build Now — part of the current build / already integrated into the current database architecture.

🔵 Coming Soon — designed as part of the fuller Munshi architecture, but not required for the current 4-day build.

⚠️ Partial — the direction is defined, but implementation or schema details still need to be finalized.

❌ Open — requires a deliberate product/engineering decision before implementation.

Database Status

🟢 Current State — Supabase Integrated

Munshi's Supabase database has already been:

Created

Connected to the application

Integrated into the current project architecture

The current database is therefore not a theoretical design only.

The remaining database-management gap is primarily around formalizing and tracking migration files, finalizing future-table constraints, and expanding the schema as additional product capabilities are implemented.

The current database should be treated as the source of truth for the application's structured financial records.

Build Now

users

The users table stores the core profile information required to scope Munshi data to an individual user.

Current fields

id
name
phone
segment
locale
filer_status

Expected meaning

Field

Purpose

id

Unique user identifier

name

User's display/name information

phone

User phone number

segment

User segment, such as freelancer or shopkeeper

locale

User's locale / language-region preference

filer_status

Filer/non-filer status or related tax-awareness state

The exact PostgreSQL data types and constraints should remain aligned with the currently integrated database.

transactions

The transactions table is the core financial ledger table.

Current fields

id
user_id
date
amount
currency
pkr_amount
exchange_rate
source
raw_description
category
raw_file_url

Expected meaning

Field

Purpose

id

Unique transaction identifier

user_id

Owner of the transaction

date

Transaction date

amount

Original transaction amount

currency

Original transaction currency

pkr_amount

PKR-normalized amount

exchange_rate

Exchange rate used for conversion

source

Origin of the transaction, such as upload or future ingestion channel

raw_description

Original/relevant transaction description

category

Munshi's current transaction category

raw_file_url

Reference to the original uploaded financial file when applicable

The transactions table is the structured financial record / ledger.

AI output should never be treated as the database itself. AI is an interpretation layer that produces structured information which must be validated before becoming a ledger record.

Row-Level Security

🟢 Build Now — RLS

Row-Level Security (RLS) is enabled on the current user-facing database tables.

RLS is a non-negotiable security baseline for Munshi because the application handles financial information.

The intended rule is:

User A
   ↓
Only User A's rows

User B
   ↓
Only User B's rows

Every user-facing query should be scoped through the authenticated user's ownership relationship.

There should be no "view all financial records" path in the normal application layer.

Conceptually:

Authenticated User
        ↓
      user_id
        ↓
      RLS policy
        ↓
Only that user's records

RLS is part of the current database architecture and should remain enabled even during development, demos, and pilot deployments.

Coming Soon

The following tables belong to the broader Munshi architecture. They are designed now but are not required to be part of the current 4-day build.

invoices

🔵 Coming Soon

The invoices table is intended to power the "who owes me" tracker.

Planned fields

id
user_id
client_name
amount
status
due_date

Planned behavior

The table will support invoice tracking such as:

Client
   ↓
Invoice
   ↓
Amount
   ↓
Paid / Unpaid
   ↓
Due Date

This will eventually connect with the client-management and outstanding-payment experience.

categories

🔵 Coming Soon

The categories table will provide a structured category system rather than relying permanently on hard-coded category values.

Planned fields

id
name
fbr_mapping
is_system_default

Planned purpose

The table can support:

System-defined categories

User-facing category names

FBR-related mappings

Future category customization

Consistent categorization across ingestion sources

The exact PostgreSQL types, constraints, and relationship model remain to be finalized when the table is implemented.

merchant_cache

🔵 Coming Soon

The merchant_cache table is one of the most important long-term optimization components in Munshi.

Planned structure

raw_description_pattern → category

The purpose is to remember previously recognized merchants and transaction patterns so that repeated transactions can be categorized deterministically.

Conceptually:

Transaction
     ↓
Normalize description
     ↓
Merchant cache lookup
     ↓
Match?
  /    \
Yes     No
 ↓       ↓
Category LLM
          ↓
       Category
          ↓
      Cache result

For example:

Payoneer fee
     ↓
Merchant cache
     ↓
Business / Platform Fee

A future matching transaction can then bypass the LLM.

Why it matters

The merchant cache is a long-term AI cost and consistency lever.

As transaction volume increases:

More transactions
       ↓
More recognized patterns
       ↓
More cache matches
       ↓
Fewer LLM calls
       ↓
Lower marginal AI cost

The cache is intentionally not treated as a prerequisite for the first working demo. It becomes increasingly valuable once Munshi has enough repeated transaction patterns to justify it.

clients

🔵 Coming Soon

The clients table will support client-level financial tracking.

Planned fields

id
user_id
name
total_billed
total_paid
outstanding
last_payment_date

Planned purpose

The table is intended to support a client-level view such as:

Client
   ↓
Total billed
   ↓
Total paid
   ↓
Outstanding
   ↓
Last payment

This will eventually work alongside invoices and freelancer-focused financial visibility.

Access Control

🟢 Build Now

1. Row-Level Security (RLS)

RLS is enabled on the current database tables and is the baseline security requirement.

The design principle is:

Every user sees only their own financial records.

There should be no normal application path that allows one user to query another user's ledger records.

🔵 Coming Soon — Designed Security Architecture

The following protections are part of the fuller Munshi architecture but are not required for the current 4-day build.

2. Field-Level Encryption

Sensitive financial fields may eventually require field-level encryption.

Potential sensitive data includes:

Transaction amounts

Client names

Raw transaction descriptions

Other personally or financially sensitive fields

Per-tenant key management is considered a broader Track B concern rather than a requirement for the current 4-day implementation.

3. Superadmin Separation

A future superadmin architecture should use a separate service layer.

The intended principle is:

Superadmin
    ↓
Aggregate / metadata views
    ↓
System-level information

NOT

Superadmin
    ↓
Raw ledger tables
    ↓
Individual financial records

The superadmin service should not require direct access to raw user financial records.

4. Break-Glass Support Access

🔵 Coming Soon

If Munshi eventually develops a real support workflow, emergency support access should be:

Time-boxed

Consent-based where appropriate

Explicitly authorized

Audit logged

Limited to the minimum information required

This is intentionally not treated as a 4-day MVP requirement because it becomes meaningful when a real support operation exists.

5. Audit Logging

🔵 Coming Soon

Audit logging should eventually track sensitive access to financial records.

Potential events include:

Administrative access

Support access

Data changes

Security-sensitive operations

Other access to protected financial information

The exact event model and retention policy remain to be finalized.

Eventual Superadmin View

🔵 Designed Intent

The eventual Munshi superadmin interface should focus on aggregate metrics and system health, not individual financial records.

By default, the superadmin view should not show:

Individual transaction amounts

Client names

Invoice details

Decrypted financial fields

Other unnecessary user-level financial information

It may show aggregate or operational information such as:

User counts

Transaction counts

System health

Processing statistics

Aggregate product metrics

Other non-sensitive metadata

The goal is to separate product administration from access to private financial information.

Current Build vs. Fuller Architecture

The database architecture should be understood in two layers.

Current 4-Day Build

Supabase
   │
   ├── users
   │
   └── transactions
          │
          └── RLS

This is the minimum viable financial data foundation.

The database is already created and integrated with the application.

Fuller Munshi Architecture

                    Supabase
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      users       transactions     categories
                       │
                       │
                merchant_cache
                       │
             ┌─────────┴─────────┐
             │                   │
          invoices             clients

Additional security and operational layers will sit around this database architecture:

Application
     ↓
Authentication
     ↓
RLS
     ↓
User-scoped data
     ↓
Ledger

Future layers:

Field-level encryption
Per-tenant key management
Superadmin separation
Break-glass support access
Audit logging

Database and AI Relationship

Munshi's database should remain independent from the AI provider.

The intended flow is:

Real-world financial input
          ↓
      Claude / AI
          ↓
   Structured output
          ↓
    Schema validation
          ↓
 Required-field validation
          ↓
    Categorization
          ↓
      Database
          ↓
      Ledger

The database should never depend on a specific Claude response format.

For example, the application should not store an entire model response as the authoritative financial record.

Instead:

AI interpretation
       ↓
Validated fields
       ↓
transactions row

This keeps the financial data layer stable even if the AI provider or model changes in the future.

Transaction Safety

The transactions table represents the user's financial record.

Therefore:

AI failure
    ↓
NOT
    ↓
Delete transaction

Instead:

AI failure / uncertainty
        ↓
Transaction retained
        ↓
Processing status / review state
        ↓
Retry or user resolution

The exact processing-state columns required for this behavior have not yet been finalized in the current schema.

This is an important future schema consideration for reliable ingestion.

Categorization and merchant_cache

The database architecture supports the broader cache-first categorization strategy.

The intended future relationship is:

Raw transaction
      ↓
Normalization
      ↓
Deterministic rules
      ↓
merchant_cache
      ↓
   ┌──┴──┐
 Match  No Match
   │       │
   ▼       ▼
Category Claude Haiku
            ↓
         Category
            ↓
       Cache result

User corrections should eventually be able to update the categorization signal:

AI Category
     ↓
User Correction
     ↓
Corrected Category
     ↓
merchant_cache
     ↓
Future transactions

This makes the database part of Munshi's long-term intelligence and cost-optimization architecture.

Data Validation

AI extraction must not directly become a database write.

The intended API/database boundary is:

Claude
  ↓
Structured JSON
  ↓
Schema validation
  ↓
Required-field validation
  ↓
Business validation
  ↓
Categorization
  ↓
Database write

The database therefore receives validated structured data rather than blindly trusting an LLM response.

Privacy Principles

Financial information should be treated as sensitive throughout the architecture.

Munshi should follow these principles:

User-scoped records

RLS at the database layer

Minimal required data sent to external AI services

Secure server-side API calls

No API credentials exposed to the client

Future field-level encryption

Future per-tenant key management

Minimal administrative access

Future audit logging for sensitive access

The database should provide a strong boundary between one user's financial information and another user's information.

Known Gaps

The database is already created and integrated, so the original statement that the schema is merely a design and that no database exists is no longer applicable.

The remaining known gaps are:

Formal migration files may still need to be created or synchronized with the current database state.

Migration tracking should be established so schema changes are reproducible across environments.

Coming-soon tables are currently conceptual rather than fully implemented.

Final PostgreSQL column types for future tables need to be finalized.

Future constraints, indexes, and foreign-key relationships need to be finalized before those tables are implemented.

Transaction processing/retry state may require additional fields as ingestion reliability is expanded.

Production-grade deduplication may require additional transaction identifiers or indexes.

Field-level encryption is not part of the current 4-day build.

Superadmin separation is not yet a production data-access layer.

Break-glass support access is not yet implemented.

Audit logging is not yet implemented.

Migration Strategy

🟢 Current Principle

The database already exists and is integrated.

The next database-engineering priority is to ensure that the actual Supabase schema is represented by tracked, reproducible migrations.

The desired state is:

Migration files
      ↓
Supabase
      ↓
Application

rather than:

Manually changed database
      ↓
Application

Tracked migrations should eventually allow the team to:

Recreate the schema

Review schema changes

Apply changes consistently across environments

Roll changes forward in a controlled way

Understand when and why a schema change occurred

Migration work should reflect the actual current database rather than accidentally redefining or destroying an already-integrated schema.

Recommended Database Evolution

The intended sequence is:

Phase 1 — Current MVP

Supabase already created
        ↓
users
        ↓
transactions
        ↓
RLS
        ↓
Application integration

Phase 2 — Schema Formalization

Current database
        ↓
Inspect actual schema
        ↓
Create / synchronize migration history
        ↓
Verify RLS policies
        ↓
Verify foreign keys / indexes

Phase 3 — Product Expansion

categories
merchant_cache
invoices
clients

Phase 4 — Advanced Security

Field-level encryption
        ↓
Per-tenant key management
        ↓
Superadmin separation
        ↓
Break-glass access
        ↓
Audit logging

The database should evolve incrementally as product usage validates each requirement.

Schema Design Principles

The following principles govern Munshi's database architecture.

1. The ledger is the source of truth.

The validated transactions record is the authoritative financial record.

AI responses are not.

2. Every financial record must be user-scoped.

A transaction belongs to a user through user_id.

3. RLS is mandatory.

Security should not depend solely on application-level filtering.

4. AI and database schemas remain decoupled.

Changing Claude models should not require redesigning the ledger.

5. Future intelligence belongs in structured data.

Merchant patterns, categories, and user corrections should eventually be represented in database structures rather than hidden inside prompts.

6. Do not overbuild the MVP.

Future tables should not be added merely because they are part of the long-term architecture.

7. Security should scale with the product.

RLS is required immediately; advanced encryption, support access controls, and audit infrastructure can be introduced as the operational requirements justify them.

8. Migrations should become the reproducible source of schema evolution.

The live database exists today, but its future evolution should be tracked through version-controlled migrations.

Summary

Database Component

Status

Supabase database creation

🟢 Already completed

Supabase application integration

🟢 Already completed

users

🟢 Build Now

transactions

🟢 Build Now

RLS

🟢 Build Now / Non-negotiable

invoices

🔵 Coming Soon

categories

🔵 Coming Soon

merchant_cache

🔵 Coming Soon

clients

🔵 Coming Soon

Field-level encryption

🔵 Coming Soon

Per-tenant key management

🔵 Coming Soon

Superadmin separation

🔵 Coming Soon

Break-glass support access

🔵 Coming Soon

Audit logging

🔵 Coming Soon

Formal migration tracking

⚠️ Remaining gap

Final future-table constraints

⚠️ Remaining gap

Production deduplication schema

⚠️ Remaining gap

Processing/retry state fields

⚠️ Remaining gap

Final Database Direction

Munshi is not intended to use the database as a passive storage layer.

The database is the structured financial foundation of the product.

The long-term architecture is:

Real-world financial activity
             ↓
        Multiple inputs
             ↓
       AI understanding
             ↓
Schema + business validation
             ↓
 Deterministic + cached
       categorization
             ↓
       User correction
             ↓
       Structured ledger
             ↓
         Supabase
             ↓
   Financial visibility

The current MVP already has the most important foundation:

Supabase
   ↓
users
   ↓
transactions
   ↓
RLS
   ↓
Munshi application

The future architecture expands this foundation with:

categories
merchant_cache
invoices
clients
        ↓
Advanced security
        ↓
Encryption
        ↓
Administrative separation
        ↓
Auditability

The guiding principle is:

Build the minimum reliable financial data foundation now, then expand the schema only when the product requirements justify it.

RLS, user isolation, validated transaction records, and a stable ledger are the baseline.

Everything else should be added deliberately as Munshi moves from MVP validation toward a production financial product.