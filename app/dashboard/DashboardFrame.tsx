import { AppShell } from "@/components/app/AppShell";
import { requireMember } from "@/lib/supabase";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { NotificationBell, type DashboardNotification } from "@/app/dashboard/components/NotificationBell";

const navItems = [
  { id: "overview", label: "Overview", href: "/dashboard/overview", icon: "◎" },
  { id: "transactions", label: "Transactions", href: "/dashboard/transactions", icon: "↨" },
  { id: "categorize", label: "Categorize", href: "/dashboard/categorize", icon: "✦" },
  { id: "clients", label: "Clients", href: "/dashboard/clients", icon: "▣" },
  { id: "accounts", label: "Connected accounts", href: "/dashboard/accounts", icon: "◌" },
  { id: "reports", label: "Reports", href: "/dashboard/reports", icon: "▤" },
  { id: "approvals", label: "Approvals", href: "/dashboard/approvals", icon: "✓" },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: "⚙" },
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
  const { businessId } = await resolveDashboardBusiness();
  const { db } = await requireMember(businessId);
  const { data: notifications } = await db
    .from("notifications")
    .select("id,type,title,body,read,created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AppShell
      navItems={navItems.map((item) => ({ ...item, group: undefined }))}
      activeItemId={activeItemId}
      title={title}
      subtitle={subtitle}
      topActions={<NotificationBell notifications={(notifications ?? []) as DashboardNotification[]} />}
      businessId={businessId}
    >
      {children}
    </AppShell>
  );
}
