Munshi — Categorization & AI Behavior

This document defines how Munshi understands, categorizes, and handles financial transactions using deterministic rules, merchant patterns, and Claude.

The document distinguishes between:

🟢 Build Now — functionality being implemented or demonstrated in the current MVP.

🔵 Coming Soon — designed behavior that belongs to the broader Munshi product architecture but is not yet wired to live functionality.

⚠️ Partial — the product direction has been decided, but some implementation or UX details remain to be finalized.

❌ Open — a design decision that still requires a deliberate product/engineering decision before implementation.

Munshi is being developed as a commercial product, so AI behavior is designed around four principles:

Accuracy — financial transactions must not be silently misclassified.

Cost efficiency — the LLM should not be called when deterministic logic can solve the problem.

Transparency — users should be able to see and correct what the system understood.

Graceful failure — an AI failure must never silently result in a missing financial record.

Categorization Logic

Status: 🟢 Build Now — Basic Rules

Status: 🔵 Coming Soon — Full Cache-First Pipeline

The categorization architecture is designed as a layered system:

Raw Transaction
       ↓
Normalization
       ↓
Deterministic Rules
       ↓
Merchant Cache
       ↓
 ┌─────┴─────┐
 │           │
Match      No Match
 │           │
 ▼           ▼
Category   LLM
             ↓
          Category
             ↓
      Cache the result
             ↓
      Show to the user

Current MVP

The MVP applies a lightweight deterministic rule layer on top of the transaction information extracted by Claude Vision.

For example:

Payoneer ──┐
Upwork   ──┼──► Freelance Income
Fiverr   ──┘

The current MVP does not depend on the full merchant-cache system.

Future Product Behavior

The fuller categorization pipeline will:

Normalize the raw transaction description.

Apply deterministic rules where a clear match exists.

Check merchant_cache for known merchants or transaction patterns.

Call the LLM only when no reliable deterministic or cached result exists.

Store the resulting classification for future use.

Present the category to the user.

Allow the user to correct or override the category.

Use valid user corrections to improve future categorization.

This creates a cache-first system in which repeated transaction patterns do not require repeated LLM inference.

Why Cache-First?

The merchant cache is an important part of Munshi's long-term unit economics.

A naive architecture would send every transaction to an LLM:

Transaction
     ↓
    LLM
     ↓
 Category

This creates unnecessary inference cost and potentially inconsistent results.

Munshi instead aims for:

Transaction
     ↓
Known pattern?
   /      \
 Yes       No
  ↓         ↓
Category   LLM
            ↓
         Category
            ↓
       Save pattern

As the cache becomes more useful, common transaction patterns can be handled without another LLM call.

Examples may include:

Payoneer fees

Upwork payments

Fiverr payments

Common software subscriptions

Common local merchants

Repeated business expenses

The long-term objective is for AI usage to become increasingly selective rather than treating the LLM as the default answer for every transaction.

LLM Selection

Status: 🔵 Coming Soon — Final Routing Architecture

Current MVP: Claude Vision for Extraction

Munshi uses Anthropic Claude as its primary AI provider.

Different AI tasks are treated separately.

Document / Image Understanding

Claude's vision-capable models are used to understand uploaded screenshots and documents.

The extraction layer identifies information such as:

Amount

Currency

Date

Sender

Transaction type

Relevant transaction description

The objective is to avoid maintaining separate OCR pipelines for every possible receipt, screenshot, or payment-platform format.

Screenshot / PDF
       ↓
Claude Vision
       ↓
Structured Transaction

Categorization Fallback

The planned categorization fallback uses Claude Haiku because categorization is a relatively narrow task and should be handled by a lower-cost model whenever possible.

The intended flow is:

Known pattern
     ↓
No LLM

Unknown pattern
     ↓
Claude Haiku
     ↓
Category

Future Escalation

For ambiguous or difficult cases at larger scale, Claude Sonnet is the planned escalation path.

The principle is:

Escalate model capability when necessary, rather than increasing LLM calls indiscriminately.

AI Confidence & User Control

Status: ⚠️ Partial

Munshi should not treat AI output as unquestionable truth.

Financial categorization is ultimately presented as an interpretation of the transaction data.

The intended UX is:

Transaction
     ↓
Munshi category
     ↓
User can accept
        OR
User can correct

A correction should be simple enough that users do not need to understand the underlying AI system.

The system should prioritize:

Clear category labels

Simple correction controls

No hidden categorization

No irreversible AI decisions

Miscategorization Handling

Status: 🟢 Build Now — Basic Override

Status: 🔵 Coming Soon — Cache Write-Back

Every categorized transaction should eventually provide a one-tap correction or override.

Example:

Adobe
Software Expense

[ Correct Category ▼ ]

If the user changes it:

Adobe
Business Expense

the correction can become a future categorization signal.

The planned behavior is:

AI Category
     ↓
User Correction
     ↓
Corrected Category
     ↓
Merchant Cache
     ↓
Future Matching Transactions

This makes user feedback part of the product's long-term intelligence layer.

Preventing Silent Financial Errors

Munshi treats missing or silently discarded transactions as more serious than an ordinary application error.

For example, if the AI cannot confidently categorize a transaction, the system should not simply:

AI failure
   ↓
Ignore transaction

Instead, the intended behavior is:

AI failure / uncertainty
        ↓
Transaction retained
        ↓
Needs review / delayed processing
        ↓
User can resolve it

The transaction itself should remain recoverable even if its category cannot immediately be determined.

Cost Strategy

Status: 🔵 Coming Soon — Full Optimization Layer

Munshi's AI architecture is designed to control inference costs without sacrificing usability.

The main principles are:

1. Deterministic rules first

Known patterns should not require an LLM.

2. Cache before LLM

Previously recognized merchants and transaction patterns should be handled through the cache.

3. Lightweight model for fallback

Claude Haiku is intended for normal categorization fallback cases.

4. Stronger model only when necessary

Claude Sonnet can be introduced for difficult or ambiguous cases.

5. Avoid unnecessary OCR services

Vision-capable Claude can directly process supported screenshots and documents rather than requiring a separate OCR service for every format.

Conceptually:

                 Transaction
                      ↓
              Deterministic rules
                      ↓
               Merchant cache
                      ↓
                ┌─────┴─────┐
                │           │
             Match       No Match
                │           │
                ▼           ▼
             Result     Claude Haiku
                            ↓
                       Still unclear?
                            ↓
                      Claude Sonnet
                      (future scale)

This architecture allows the product to increase AI capability without making every transaction increasingly expensive.

Free / Low-Cost Product Validation

Status: 🟢 Current Product Principle

Munshi is designed so that the initial product can be validated without requiring a large paid AI infrastructure stack.

The architecture avoids unnecessary services where Claude can perform the required multimodal task directly.

Potential future paid components include:

Higher-tier Claude models

Dedicated document-AI services

Background processing infrastructure

WhatsApp Business infrastructure

Higher-tier Supabase/Vercel services

These should be introduced based on actual product usage and commercial requirements rather than being treated as prerequisites for the MVP.

FBR & Tax-Time Output

Status: 🟢 Build Now — Awareness

Status: 🔵 Coming Soon — Expanded Financial Preparation

Munshi's tax-related functionality is deliberately scoped as:

Awareness, not advice.

The product can help organize financial information and surface useful context without claiming to replace a tax professional.

Current / Planned Awareness

Munshi may surface:

Non-filer awareness

Plain-language explanation of the flag

Links toward NTN registration / FBR resources

Common freelancer expense categories

Potential categories include:

Internet

Software

Equipment

Platform fees

Other legitimate business expenses

The purpose is to help the user organize information they can discuss with a qualified professional.

Deliberately Out of Scope

Munshi does not attempt to provide:

Certified tax advice

Professional tax representation

Guaranteed tax liability

Tax filing on behalf of the user

An exact tax-owed figure

A permanent hard-coded interpretation of annual tax slabs

Tax rules can change, and professional advice may be required.

Every tax-adjacent feature should therefore carry an appropriate disclaimer.

Tax Disclaimer

The intended product language is:

Munshi organizes your financial information. It does not file taxes or provide certified tax advice.

The product should direct users to qualified professionals for official tax filing and advice.

WhatsApp Quick-Logging

Status: ⚠️ Partial

The intended future behavior is that a user could send a message such as:

spent 5000 on Adobe

and Munshi would interpret it as a transaction.

The message would enter the same categorization pipeline used by other ingestion sources:

WhatsApp Message
       ↓
Text Parsing
       ↓
Transaction Structure
       ↓
Rules / Cache
       ↓
LLM if necessary
       ↓
Ledger

Still to Define

The following details remain implementation decisions:

Exact amount parsing

Currency inference

Multiple transactions in one message

Ambiguous messages

Missing amounts

Missing merchant names

Confirmation UX

Error responses

User confirmation before saving uncertain transactions

The key principle is that WhatsApp should eventually use the same underlying financial categorization system rather than becoming a separate categorization engine.

Gmail Ingestion

Status: ⚠️ Partial

The planned Gmail integration uses read-only OAuth.

The design intentionally minimizes access by restricting the ingestion scope to relevant payment-confirmation sources rather than treating Munshi as a general-purpose email reader.

Conceptually:

Gmail
  ↓
Read-only OAuth
  ↓
Relevant payment confirmation
  ↓
Parser
  ↓
Transaction
  ↓
Categorization
  ↓
Ledger

Still to Define

Exact supported email formats

Payment-confirmation detection

Parser rules

Duplicate detection

Failed parsing behavior

User confirmation behavior

Handling of unsupported email formats

JazzCash SMS Forwarding

Status: ⚠️ Partial

The planned JazzCash integration uses SMS forwarding rather than a direct API integration.

The intended flow is:

JazzCash SMS
     ↓
User forwards message
     ↓
Munshi parser
     ↓
Transaction
     ↓
Categorization
     ↓
Ledger

This approach is designed around the available integration path while avoiding unnecessary dependence on an inaccessible direct API.

Still to Define

Exact SMS formats

Parser rules

Duplicate detection

Unsupported-message behavior

Confirmation UX

Handling of ambiguous SMS content

Duplicate Transactions

Status: ⚠️ Partial

As Munshi expands to multiple ingestion sources, the same transaction may potentially arrive through more than one channel.

For example:

Bank statement
     +
Gmail confirmation
     ↓
Same transaction

The product therefore needs a reliable deduplication strategy before multiple automated ingestion channels become fully operational.

Potential matching signals include:

User

Amount

Currency

Date

Sender / merchant

Source

Transaction reference

The exact production deduplication algorithm remains to be finalized.

LLM / API Failure Handling

Status: ❌ Open

A failure in an AI or external API call must not silently delete or discard a financial transaction.

The final implementation needs a deliberate failure strategy.

Potential behavior:

AI / API unavailable
        ↓
Transaction retained
        ↓
Processing status = delayed
        ↓
Retry
        ↓
Success

Possible mechanisms include:

Retry logic

Exponential backoff

Temporary processing states

User-visible "processing delayed" messages

Secondary model/provider

Manual review

A secondary provider is not currently required by the architecture, but may be considered if reliability requirements justify it.

Out-of-Scope Input Handling

Status: ❌ Open

Munshi must eventually define what happens when an uploaded file is not a financial transaction.

Examples:

Random screenshot

Personal photograph

Unrelated PDF

Unsupported document

Corrupted file

Screenshot with no recognizable transaction

The system should not attempt to invent financial information from unrelated input.

Possible future behavior:

Upload
  ↓
Financial document?
   /       \
 Yes        No
  ↓          ↓
Process    Reject
           with clear
           explanation

The exact UX and confidence threshold remain open.

Data Validation Before Categorization

Status: 🟢 Build Now

AI extraction should not directly become a database transaction.

The intended sequence is:

Claude
  ↓
Structured JSON
  ↓
Schema Validation
  ↓
Required-field validation
  ↓
Categorization
  ↓
Database Write

This separation is important because an AI-generated response should not be treated as inherently valid database data.

The API layer is responsible for validating the extracted structure before writing it to the ledger.

AI Is Not the Source of Truth

Munshi's architecture treats AI as an interpretation layer.

The source of truth is the structured financial record stored in the ledger, not the LLM response itself.

Raw Financial Input
        ↓
       AI
        ↓
Structured Data
        ↓
Validation
        ↓
Ledger

Once written and validated, the transaction becomes part of the user's financial record.

AI is used to understand the input, not to become the database.

Privacy Considerations

Status: 🟢 Build Now — Core Isolation

Status: 🔵 Coming Soon — Advanced Protection

Financial information sent to AI services must be treated as sensitive.

The broader architecture therefore considers:

User-scoped records

Supabase RLS

Minimal required data sent to external AI services

Secure server-side API calls

No exposure of API credentials to the client

Future field-level encryption

Future per-tenant key management

Munshi should minimize the amount of information sent to external services while still providing enough context for accurate extraction and categorization.

AI Behavior Principles

The following principles govern Munshi's AI layer:

1. AI assists; it does not silently decide.

Users should be able to correct important interpretations.

2. Rules beat AI when rules are sufficient.

Known patterns should be deterministic.

3. Cache beats repeated inference.

Previously understood patterns should not require unnecessary LLM calls.

4. Failed AI calls must not mean lost transactions.

Financial records must remain recoverable.

5. Tax awareness is not tax advice.

Munshi organizes information but does not replace qualified professionals.

6. The AI layer should remain replaceable.

The ledger and transaction schema should not depend on a specific model provider's internal response format.

7. Transparency matters.

The product should clearly distinguish extracted information, categorization, and user corrections.

Summary

Question

Status

Basic categorization rules

🟢 Build Now

Claude Vision extraction

🟢 Build Now

Structured JSON validation

🟢 Build Now

Merchant-cache categorization

🔵 Coming Soon

LLM fallback with Claude Haiku

🔵 Coming Soon

Claude Sonnet escalation

🔵 Coming Soon

One-tap correction / override

🟢 / 🔵 Based on MVP implementation

Correction write-back to cache

🔵 Coming Soon

Cost optimization through cache-first design

🔵 Coming Soon

FBR / non-filer awareness

🟢 Build Now

Expanded tax preparation

🔵 Coming Soon

WhatsApp quick-logging

⚠️ Partial

Gmail ingestion

⚠️ Partial

JazzCash SMS forwarding

⚠️ Partial

Duplicate transaction handling

⚠️ Partial

LLM/API failure behavior

❌ Open

Out-of-scope input handling

❌ Open

Advanced privacy/encryption

🔵 Coming Soon

Final Design Direction

Munshi is not intended to be an AI chatbot that happens to know about money.

It is a financial data system with AI at the ingestion and interpretation layer.

The long-term architecture is:

Real-world financial activity
             ↓
      Multiple inputs
             ↓
     AI understanding
             ↓
  Deterministic + cached
       categorization
             ↓
      User correction
             ↓
      Structured ledger
             ↓
    Financial visibility

The current MVP proves the core of this loop.

The coming architecture is designed to make the loop increasingly automated, intelligent, secure, and commercially scalable.

The intelligence should become increasingly efficient over time:

More transactions
       ↓
More known patterns
       ↓
More cache matches
       ↓
Fewer unnecessary LLM calls
       ↓
Lower marginal AI cost
       ↓
More scalable product

The goal is not to make AI do everything.

The goal is to use AI where it creates the most value, while deterministic systems handle everything that can be handled reliably without it.