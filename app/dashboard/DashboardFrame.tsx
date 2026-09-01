import { AppShell } from "@/components/app/AppShell";
import { requireMember } from "@/lib/supabase";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { getPendingPaymentVerification } from "@/lib/payment-verification";
import { NotificationBell, type DashboardNotification } from "@/app/dashboard/components/NotificationBell";

const navItems = [
  { id: "overview", label: "Overview", href: "/dashboard/overview", icon: "◎", group: "Ledger" },
  { id: "ingest", label: "Ingest", href: "/dashboard/ingest", icon: "↥", group: "Ledger" },
  { id: "transactions", label: "Transactions", href: "/dashboard/transactions", icon: "↨", group: "Ledger" },
  { id: "categorize", label: "Categorize", href: "/dashboard/categorize", icon: "✦", group: "Ledger" },
  { id: "clients", label: "Clients & reminders", href: "/dashboard/clients", icon: "▣", group: "Ledger" },
  { id: "approvals", label: "Approvals", href: "/dashboard/approvals", icon: "✓", group: "Ledger" },
  { id: "reports", label: "Reports & tax", href: "/dashboard/reports", icon: "▤", group: "Ledger" },
  { id: "connections", label: "Connected accounts", href: "/dashboard/connections", icon: "◌", group: "Workspace" },
  { id: "billing", label: "Plan & billing", href: "/dashboard/billing", icon: "¤", group: "Workspace" },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: "⚙", group: "Workspace" },
] as const;

export async function DashboardFrame({
  title,
  subtitle,
  activeItemId,
  children,
}: {
  title: string;
  subtitle?: string;
  activeItemId: (typeof navItems)[number]["id"];
  children: React.ReactNode;
}) {
  const { businessId, user } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const [{ data: notifications }, { data: business }, pending] = await Promise.all([
    db
      .from("notifications")
      .select("id,type,title,body,read,created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("businesses").select("plan").eq("id", businessId).single(),
    getPendingPaymentVerification(businessId),
  ]);
  const activePlan = business?.plan ?? "khata";
  const activePlanLabel = activePlan === "teams" ? "Munshi Teams" : activePlan === "pro" ? "Munshi Pro" : "Khata";
  const requestedPlanLabel = pending?.requestedPlan === "teams" ? "Munshi Teams" : "Munshi Pro";
  const displayName = String(user.user_metadata.full_name || user.email || "User");
  const initials = displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppShell
      navItems={navItems}
      activeItemId={activeItemId}
      title={title}
      subtitle={subtitle}
      topActions={
        <>
          {pending ? (
            <div className="payment-review-header" title={`Reference ${pending.transactionReference}`}>
              <span className="status-tag expiring">Payment verification pending</span>
              <span>{requestedPlanLabel} · {pending.requestedCycle} · TID {pending.transactionReference}</span>
            </div>
          ) : null}
          <span className={`dashboard-plan-badge ${activePlan}`}>{activePlanLabel}</span>
          <span className="dashboard-avatar" aria-label={displayName} title={displayName}>{initials}</span>
          <NotificationBell notifications={(notifications ?? []) as DashboardNotification[]} />
        </>
      }
      businessId={businessId}
    >
      {children}
    </AppShell>
  );
}
