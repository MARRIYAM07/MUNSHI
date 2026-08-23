# Shared components

- `AppShell`: `<AppShell navItems={navItems} activeItemId="transactions" title="Transactions">…</AppShell>` builds the shared console sidebar/topbar frame.
- `KpiCard`: `<KpiCard label="Income" value="Rs 60,000" tone="forest" />` renders a ledger KPI tile.
- `LedgerTable`: `<LedgerTable rows={rows} columns={columns} getRowKey={row => row.id} getRowStatus={row => row.status} />` renders typed transaction or categorization rows.
- `StatusPill`: `<StatusPill value="review" />` renders the reference label and semantic ink color.
- `Toast`: wrap a console in `<ToastProvider>`, then call `const toast=useToast(); toast("Settings saved");` from a client component.
- `Modal`: `<Modal open={open} title="Member ledger" onClose={() => setOpen(false)}>…</Modal>` renders the shared backdrop/dialog structure.
- `ToggleSwitch`: `<ToggleSwitch checked={enabled} onCheckedChange={setEnabled} label="Enable JazzCash" />` renders the connected-account switch.
