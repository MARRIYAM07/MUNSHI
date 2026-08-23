# Munshi design system

This is the shared visual source of truth extracted from the seven immutable HTML references in `docs/design-reference/`. Page-specific interactions, pricing animations, ingestion demos, notification panels, and chart/SVG rules remain local to their eventual components.

## Reconciliation decisions

All same-named color tokens are identical across the seven references; there was no hex drift to resolve in the checked-in files. The core values therefore use the unanimous palette. `--forest-glow`, `--brass-glow`, and `--white-card` appeared only in the superadmin reference and are retained because they are named palette primitives rather than chart-specific values. Where component treatments differ, the sharp admin/team-owner version wins over superadmin's rounded fork because it appears more often and matches the product's mostly sharp-corner ledger language.

## Tokens

- `--paper` — `#EAE3D3`, the primary khata-paper canvas; all seven references.
- `--paper-alt` — `#F3EEE1`, raised cards and alternate paper surfaces; all seven references.
- `--paper-line` — `#C9C2AC`, rules, borders, and ledger lines; all seven references.
- `--white-card` — `#FBF9F3`, the lightest elevated surface; superadmin.
- `--ink` — `#1A2E22`, primary text and rule ink; all seven references.
- `--ink-soft` — `#4A5148`, secondary body text; all seven references.
- `--muted` — `#7A7361`, metadata, hints, and inactive controls; all seven references.
- `--forest` — `#14442F`, primary action, credit, and success color; all seven references.
- `--forest-dark` — `#0D2E1F`, sidebar, headings, and dark action states; all seven references.
- `--forest-glow` — `#1F6B47`, brighter forest focus/active accent; superadmin.
- `--red` — `#9C2B1B`, debit, danger, and red-ink emphasis; all seven references.
- `--red-soft` — `#C2543F`, softer warning and decorative red; all seven references.
- `--brass` — `#A97C2F`, ledger accent, medium confidence, and learned states; all seven references.
- `--brass-glow` — `#D9A94B`, brighter brass highlight on dark surfaces; superadmin.
- `--serif` — IBM Plex Serif with Georgia fallback, for wordmarks and headings; all seven references.
- `--sans` — IBM Plex Sans with system fallbacks, for UI and body copy; all seven references.
- `--mono` — IBM Plex Mono with monospace fallbacks, for amounts, metadata, and controls; all seven references.
- `--sp1` through `--sp8` — `4, 8, 16, 24, 32, 48, 64, 96px`, the shared spacing scale; landing, normalized for all pages.

## Shared classes

- `.mono` — applies the ledger's monospace face; landing, admin, payment, signup, superadmin, and team-owner.
- `.wrap` — centered responsive page-width container; landing, signup, and payment.
- `.wordmark` / `.wordmark .dot` — serif Munshi brand lockup and red full stop; landing, login, signup, and payment.
- `.eyebrow` — brass uppercase section kicker with a short rule; landing, signup, and payment.
- `.card` — base alternate-paper card with a sharp rule border; admin, login, and team-owner.
- `.card-head` / `.card-body` — standard bordered card header and padded content regions; admin and team-owner, aligned with superadmin panels.
- `.kpi-row` — responsive dashboard metric grid; admin, superadmin, and team-owner.
- `.kpi-card` — sharp KPI surface with a forest top rule; admin/team-owner plus landing growth cards.
- `.kpi-card.brass` / `.kpi-card.red` — explicit brass and red KPI accents replacing position-dependent styling; admin, landing, and team-owner.
- `.kpi-card .num` / `.kpi-card .lbl` — monospace metric value and uppercase label; admin, landing, superadmin, and team-owner.
- `.btn` — sharp, outlined monospace action button; admin, login, signup, payment, superadmin, and team-owner.
- `.btn.solid` — forest-filled primary action; admin, landing, signup, payment, and team-owner.
- `.btn.danger` — red-ink destructive action; admin.
- `.btn.ghost` — neutral paper action; superadmin, reconciled to the shared sharp button.
- `.btn.small` / `.btn.wide` — compact and full-width button sizing modifiers; admin, signup, payment, superadmin, and team-owner.
- `.shell` — two-column application shell; admin, superadmin, and team-owner.
- `.side` / `.sidebar` — sticky forest sidebar container; admin, superadmin, and team-owner.
- `.side-brand` / `.side-nav` / `.side-foot` — shared sidebar brand, navigation, and account/footer regions; admin, superadmin, and team-owner.
- `.side-link` / `.nav-item` — shared sharp sidebar navigation item; admin/team-owner and the reconciled superadmin nav.
- `.side-link.active` / `.nav-item.active` — brass left-rule active navigation state; admin, superadmin, and team-owner.
- `.table-scroll` — horizontal overflow wrapper for narrow ledger tables; landing and admin.
- `.ledger-row` / `.ledger-row.head` — dashed ledger record and uppercase header grid; landing, admin, and team-owner.
- `.amt-cell`, `.amt.credit`, and `.amt.debit` — right-aligned amount with forest credit and red debit states; landing, admin, payment, superadmin, and team-owner.
- `.ledger-table` / `.cat-table` — shared monospace ledger table; landing, admin, and superadmin.
- `.status-tag` / `.status-pill` — compact uppercase transaction or account state marker; landing, admin, and superadmin.
- `.confidence-pill` — text confidence marker using the same semantic palette as statuses; derived from admin/landing confidence dots and superadmin pills.
- `.conf-dot` — circular high/medium/low/learned confidence indicator; landing and admin.
- `.toggle` — button-form on/off switch; admin.
- `.switch` / `.slider` — accessible checkbox-form on/off switch with the same dimensions and colors; superadmin.
- `.form-field` — stacked label and paper input group with forest focus treatment; login, signup, payment, superadmin, and team-owner.
- `.toast` / `#toast` — fixed dark confirmation toast with brass ledger edge; landing, admin, superadmin, and team-owner.
- `.modal-backdrop` / `.modal-bg` — centered forest-tinted modal overlay; superadmin and team-owner.
- `.modal` / `.modal-head` / `.modal-body` / `.modal-close` — sharp paper dialog structure; superadmin and team-owner.
- `.gate` / `.gate-card` / `.gate-hint` — full-screen access gate and centered credential card; login and superadmin.

## Intentionally local

Pricing/billing toggles, landing reveal and FAQ animations, ingestion scanning, notification drawers, plan/tariff cards, and superadmin line/donut/health chart rules are not global. Their styles belong beside the components that implement them.
