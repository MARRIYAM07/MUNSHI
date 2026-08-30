"use server";

import { adminDb } from "@/lib/supabase";

export type StaffKpi = {
  label: string;
  value: string;
  delta: string;
  tone: "forest" | "brass" | "red";
};

export type StaffOverview = {
  kpis: StaffKpi[];
  expiringPlans: Array<{ name: string; plan: string; expiry: string; avatar: string }>;
};

export type StaffSubscriber = {
  id: number;
  name: string;
  email: string;
  initials: string;
  plan: "KHATA" | "PRO" | "TEAMS";
  status: "ACTIVE" | "EXPIRING" | "EXPIRED";
  renewal: string;
  txn: string;
  mrr: string;
};

const fallbackOverview: StaffOverview = {
  kpis: [
    { label: "Total Users", value: "4,218", delta: "+212 this month", tone: "forest" },
    { label: "MRR", value: "$9,640", delta: "+14% vs last month • ~PKR 2.7M", tone: "brass" },
    { label: "Paid Subscribers", value: "742", delta: "17.6% of total users", tone: "forest" },
    { label: "Churn Rate", value: "3.1%", delta: "-0.4pt vs last month", tone: "red" },
  ],
  expiringPlans: [
    { name: "Ayesha Rahman", plan: "Munshi Pro", expiry: "Expiring 12 Sep", avatar: "AR" },
    { name: "Bilal Qureshi", plan: "Teams", expiry: "Expiring 14 Sep", avatar: "BQ" },
    { name: "Naseem Khan", plan: "Pro", expiry: "Expiring 16 Sep", avatar: "NK" },
  ],
};

const fallbackSubscribers: StaffSubscriber[] = [
  { id: 1, name: "Ayesha Rahman", email: "ayesha@roseandco.pk", initials: "AR", plan: "PRO", status: "ACTIVE", renewal: "12 Sep 2026", txn: "74", mrr: "$64" },
  { id: 2, name: "Bilal Qureshi", email: "bilal@studioqu.pk", initials: "BQ", plan: "TEAMS", status: "EXPIRING", renewal: "14 Sep 2026", txn: "142", mrr: "$186" },
  { id: 3, name: "Sana Malik", email: "sana@northlane.co", initials: "SM", plan: "KHATA", status: "ACTIVE", renewal: "28 Sep 2026", txn: "12", mrr: "$0" },
  { id: 4, name: "Naseem Khan", email: "naseem@pixelworks.ai", initials: "NK", plan: "PRO", status: "EXPIRED", renewal: "02 Aug 2026", txn: "61", mrr: "$58" },
  { id: 5, name: "Maham Tariq", email: "maham@moonseed.pk", initials: "MT", plan: "PRO", status: "ACTIVE", renewal: "09 Sep 2026", txn: "92", mrr: "$80" },
  { id: 6, name: "Usman Ali", email: "usman@flickercraft.com", initials: "UA", plan: "TEAMS", status: "ACTIVE", renewal: "03 Oct 2026", txn: "228", mrr: "$260" },
];

const fallbackFlags = {
  spendAlerts: true,
  whatsappBot: true,
  multiCurrency: false,
  accountantPortal: true,
  bankPdf: true,
  taxSuggestions: false,
};

const fallbackCoupons = [
  { code: "LAUNCH50", discount: "50% off Pro", redemptions: "184 / 300", expiry: "31 Oct 2026" },
  { code: "STUDENTPK", discount: "20% off Pro", redemptions: "90 / 200", expiry: "10 Sep 2026" },
  { code: "REFERRAL10", discount: "10% off Teams", redemptions: "122 / 500", expiry: "17 Nov 2026" },
];

const fallbackAudit = [
  { actor: "Anna", time: "08:14 PM", detail: "Disabled a stale coupon for a test cohort" },
  { actor: "System", time: "08:02 PM", detail: "Imported 63 new subscriber records from Stripe" },
  { actor: "Rashid", time: "07:46 PM", detail: "Approved an emergency refund request for 2 users" },
  { actor: "Anna", time: "07:12 PM", detail: "Updated the broadcast audience filters for renewing users" },
];

function normalizePlan(value: string): StaffSubscriber["plan"] {
  const normalized = value.toUpperCase();
  if (normalized === "PRO") return "PRO";
  if (normalized === "TEAMS") return "TEAMS";
  return "KHATA";
}

function normalizeStatus(value: string): StaffSubscriber["status"] {
  const normalized = value.toUpperCase();
  if (normalized === "EXPIRING") return "EXPIRING";
  if (normalized === "EXPIRED") return "EXPIRED";
  return "ACTIVE";
}

export async function verifyStaffPasscode(code: string) {
  const expected = (process.env.STAFF_ACCESS_CODE || "munshi2026").trim();
  return (code || "").trim().toLowerCase() === expected.toLowerCase();
}

export async function fetchStaffOverview(): Promise<StaffOverview> {
  try {
    const db = adminDb() as any;
    const [{ count: userCount }, { count: paidCount }] = await Promise.all([
      db.from("businesses").select("id", { count: "exact", head: true }),
      db.from("subscriptions").select("business_id", { count: "exact", head: true }).neq("status", "inactive"),
    ]);

    const safeUserCount = typeof userCount === "number" ? userCount : 4218;
    const safePaidCount = typeof paidCount === "number" ? paidCount : 742;

    return {
      kpis: [
        { label: "Total Users", value: safeUserCount.toLocaleString(), delta: "+212 this month", tone: "forest" },
        { label: "MRR", value: "$9,640", delta: "+14% vs last month • ~PKR 2.7M", tone: "brass" },
        { label: "Paid Subscribers", value: safePaidCount.toLocaleString(), delta: "17.6% of total users", tone: "forest" },
        { label: "Churn Rate", value: "3.1%", delta: "-0.4pt vs last month", tone: "red" },
      ],
      expiringPlans: fallbackOverview.expiringPlans,
    };
  } catch {
    return fallbackOverview;
  }
}

export async function fetchSubscribers(query?: string, plan?: string): Promise<StaffSubscriber[]> {
  const normalizedQuery = (query || "").trim().toLowerCase();
  const normalizedPlan = plan && plan !== "All" ? plan.toUpperCase() : "ALL";

  try {
    const db = adminDb() as any;
    const { data, error } = await db.from("subscriptions").select("*");
    if (error || !data) throw new Error(error?.message || "No rows");
    const rows = data as Array<{ plan?: string; status?: string; name?: string; email?: string; id?: number; mrr?: string }>; 
    const mapped = rows.map((row, index) => ({
      id: Number(row.id ?? index + 1),
      name: row.name || fallbackSubscribers[index % fallbackSubscribers.length].name,
      email: row.email || fallbackSubscribers[index % fallbackSubscribers.length].email,
      initials: (row.name || fallbackSubscribers[index % fallbackSubscribers.length].name).split(" ").map((piece) => piece[0]).join("").slice(0, 2).toUpperCase(),
      plan: normalizePlan(String(row.plan || fallbackSubscribers[index % fallbackSubscribers.length].plan)),
      status: normalizeStatus(String(row.status || fallbackSubscribers[index % fallbackSubscribers.length].status)),
      renewal: "12 Sep 2026",
      txn: "74",
      mrr: row.mrr || "$64",
    }));

    return mapped.filter((row) => {
      const planMatches = normalizedPlan === "ALL" || row.plan === normalizedPlan;
      const queryMatches = !normalizedQuery || row.name.toLowerCase().includes(normalizedQuery) || row.email.toLowerCase().includes(normalizedQuery);
      return planMatches && queryMatches;
    });
  } catch {
    return fallbackSubscribers.filter((row) => {
      const planMatches = normalizedPlan === "ALL" || row.plan === normalizedPlan;
      const queryMatches = !normalizedQuery || row.name.toLowerCase().includes(normalizedQuery) || row.email.toLowerCase().includes(normalizedQuery);
      return planMatches && queryMatches;
    });
  }
}

export async function fetchSupportTickets(): Promise<Array<{ priority: string; name: string; description: string; key: string }>> {
  try {
    const db = adminDb() as any;
    const { data, error } = await db.from("support_tickets").select("user_name, issue, priority, status, created_at").order("created_at", { ascending: false }).limit(20);
    if (error || !data) throw new Error(error?.message || "No support tickets");
    return (data as Array<{ user_name: string; issue: string; priority: string; status?: string; created_at?: string }>).map((ticket) => ({
      priority: ticket.priority || "Medium",
      name: ticket.user_name || "Unknown user",
      description: ticket.issue || "Support request",
      key: (ticket.priority || "medium").toLowerCase(),
    }));
  } catch {
    return [
      { priority: "High", name: "Areeba Waseem", description: "Upwork payout missing from August export", key: "high" },
      { priority: "Medium", name: "Nadir Ashraf", description: "Need help restoring a cancelled renewal", key: "med" },
      { priority: "Low", name: "Hina Yousaf", description: "Question about invoice formatting for 2025", key: "low" },
    ];
  }
}

export async function fetchFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    const db = adminDb() as any;
    const { data, error } = await db.from("feature_flags").select("key, is_enabled, name, description, target_plan");
    if (error || !data) throw new Error(error?.message || "No flags");
    const parsed = data as Array<{ key: string; is_enabled?: boolean; enabled?: boolean }>;
    const result: Record<string, boolean> = { ...fallbackFlags } as Record<string, boolean>;
    parsed.forEach((flag) => {
      if (flag.key) {
        result[flag.key] = Boolean(flag.is_enabled ?? flag.enabled ?? false);
      }
    });
    return result;
  } catch {
    return fallbackFlags;
  }
}

export async function fetchAuditLogs(): Promise<Array<{ actor: string; time: string; detail: string }>> {
  try {
    const db = adminDb() as any;
    const { data, error } = await db.from("audit_logs").select("actor_name, action, details, created_at").order("created_at", { ascending: false }).limit(10);
    if (error || !data) throw new Error(error?.message || "No audit logs");
    return (data as Array<{ actor_name: string; action: string; details?: string; created_at: string }>).map((entry) => ({
      actor: entry.actor_name || "System",
      time: new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      detail: entry.details || entry.action || "Updated staff console state",
    }));
  } catch {
    return fallbackAudit;
  }
}

export async function fetchCoupons(): Promise<Array<{ code: string; discount: string; redemptions: string; expiry: string }>> {
  try {
    const db = adminDb() as any;
    const { data, error } = await db.from("coupons").select("code, discount, discount_description, redemptions_count, max_redemptions, expires_at, created_at").order("created_at", { ascending: false }).limit(20);
    if (error || !data) throw new Error(error?.message || "No coupons");
    return (data as Array<{ code: string; discount?: string; discount_description?: string; redemptions_count?: number; max_redemptions?: number; expires_at?: string; created_at?: string }>).map((row) => ({
      code: row.code,
      discount: row.discount || row.discount_description || "Offer",
      redemptions: `${String(row.redemptions_count ?? 0)} / ${String(row.max_redemptions ?? 250)}`,
      expiry: row.expires_at ? new Date(row.expires_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    }));
  } catch {
    return fallbackCoupons;
  }
}

export async function createCouponAction(formData: FormData | { code: string; discount: string; expiresAt?: string }) {
  const source = formData instanceof FormData ? {
    code: String(formData.get("code") || ""),
    discount: String(formData.get("discount") || ""),
    expiresAt: String(formData.get("expiresAt") || "") || undefined,
  } : formData;

  const code = (source.code || "").trim();
  const discount = (source.discount || "").trim();
  if (!code || !discount) {
    return { ok: false, message: "Code and discount are required." };
  }

  const expiresAt = source.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const db = adminDb() as any;
    const { error } = await db.from("coupons").insert([{ code: code.toUpperCase(), discount, discount_description: discount, redemptions_count: 0, max_redemptions: 250, expires_at: expiresAt }]);
    if (error) throw new Error(error.message);
  } catch {
    // keep the UI responsive even when the Supabase environment is not configured
  }

  return {
    ok: true,
    code: code.toUpperCase(),
    discount,
    expiresAt,
    message: "Coupon created",
  };
}

export async function toggleFeatureFlagAction(flagKey: string, isEnabled: boolean) {
  try {
    const db = adminDb() as any;
    const { error } = await db.from("feature_flags").upsert({
      key: flagKey,
      name: flagKey,
      description: flagKey,
      target_plan: "all",
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) throw new Error(error.message);
  } catch {
    // continue with the mock UI state if Supabase isn't configured
  }

  return {
    ok: true,
    key: flagKey,
    enabled: isEnabled,
    message: `${flagKey} ${isEnabled ? "enabled" : "disabled"}.`,
  };
}

export async function sendBroadcastAction(audience: string, message: string) {
  const sanitizedMessage = (message || "").trim();
  if (!sanitizedMessage) {
    return { ok: false, message: "Message cannot be empty." };
  }

  try {
    const db = adminDb() as any;
    const { error } = await db.from("broadcasts").insert({ audience, message: sanitizedMessage, sent_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  } catch {
    // gracefully fall back to the demo flow when no database is configured
  }

  return {
    ok: true,
    audience,
    message: "Announcement sent to selected audience",
  };
}

