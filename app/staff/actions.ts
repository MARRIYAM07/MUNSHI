"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffAccess, staffAccessCookieName } from "@/lib/staff-access";
import { adminDb } from "@/lib/supabase";

async function staffDb() {
  await requireStaffAccess();
  return adminDb();
}

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

export type PaymentVerificationRequest = {
  id: string;
  businessName: string;
  subscriberName: string;
  requestedPlan: "pro" | "teams";
  requestedCycle: "monthly" | "yearly";
  rail: "jazzcash" | "easypaisa" | "bank";
  transactionReference: string;
  receiptName: string;
  receiptContentType: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

const flagKeys = z.enum([
  "spendAlerts",
  "whatsappBot",
  "multiCurrency",
  "accountantPortal",
  "bankPdf",
  "taxSuggestions",
]);

const paymentDecisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

function actionError(error: unknown) {
  if (error instanceof Response) {
    return "Enter the staff access code to continue.";
  }

  if (error instanceof Error) {
    if (error.message.includes("already been resolved")) return "This payment request has already been resolved.";
    if (error.message.includes("rejection reason")) return error.message;
    return error.message || "The action could not be completed.";
  }

  return "The action could not be completed.";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "—";
}

export async function fetchStaffOverview(): Promise<StaffOverview> {
  const db = await staffDb();
  const [{ count: businessCount, error: businessError }, { count: paidCount, error: subscriptionError }] = await Promise.all([
    db.from("businesses").select("id", { count: "exact", head: true }),
    db.from("subscriptions").select("business_id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  if (businessError) throw new Error(businessError.message);
  if (subscriptionError) throw new Error(subscriptionError.message);

  return {
    kpis: [
      { label: "Total businesses", value: String(businessCount ?? 0), delta: "Current workspace count", tone: "forest" },
      { label: "Active paid plans", value: String(paidCount ?? 0), delta: "Verified subscriptions", tone: "brass" },
      { label: "Pending payments", value: "—", delta: "Review in Plans & Revenue", tone: "forest" },
      { label: "Churn rate", value: "—", delta: "Reporting unavailable", tone: "red" },
    ],
    expiringPlans: [],
  };
}

export async function fetchSubscribers(query?: string, plan?: string): Promise<StaffSubscriber[]> {
  const db = await staffDb();
  const selectedPlan = plan === "KHATA" ? "khata" : plan === "PRO" ? "pro" : plan === "TEAMS" ? "teams" : null;
  let request = db.from("subscriptions").select("business_id, status, current_period_end, businesses(name, plan)").order("current_period_end", { ascending: true }).limit(100);
  if (selectedPlan) request = request.eq("businesses.plan", selectedPlan);

  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const term = (query || "").trim().toLowerCase();
  const subscribers: StaffSubscriber[] = (data || []).map((row: any, index: number): StaffSubscriber => {
    const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
    const name = business?.name || "Unknown business";
    const planValue = String(business?.plan || "khata").toUpperCase();
    const statusValue = String(row.status || "inactive").toUpperCase();
    const periodEnd = row.current_period_end ? new Date(row.current_period_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    return {
      id: index + 1,
      name,
      email: "—",
      initials: initials(name),
      plan: planValue === "PRO" ? "PRO" : planValue === "TEAMS" ? "TEAMS" : "KHATA",
      status: statusValue === "EXPIRED" || statusValue === "INACTIVE" ? "EXPIRED" : "ACTIVE",
      renewal: periodEnd,
      txn: "—",
      mrr: "—",
    };
  });

  return subscribers.filter((row) => !term || row.name.toLowerCase().includes(term));
}

export async function fetchSupportTickets(): Promise<Array<{ priority: string; name: string; description: string; key: string }>> {
  const db = await staffDb();
  const { data, error } = await db.from("support_tickets")
    .select("user_name, issue, priority")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);

  return (data || []).map((ticket: any) => ({
    priority: ticket.priority || "Medium",
    name: ticket.user_name || "Unknown user",
    description: ticket.issue || "Support request",
    key: String(ticket.priority || "medium").toLowerCase(),
  }));
}

export async function fetchFeatureFlags(): Promise<Record<string, boolean>> {
  const db = await staffDb();
  const { data, error } = await db.from("feature_flags").select("key, is_enabled");
  if (error) throw new Error(error.message);

  return (data || []).reduce((result: Record<string, boolean>, flag: any) => {
    result[flag.key] = Boolean(flag.is_enabled);
    return result;
  }, {});
}

export async function fetchAuditLogs(): Promise<Array<{ actor: string; time: string; detail: string }>> {
  const db = await staffDb();
  const { data, error } = await db.from("audit_logs")
    .select("actor_name, action, details, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw new Error(error.message);

  return (data || []).map((entry: any) => ({
    actor: entry.actor_name || "System",
    time: new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    detail: entry.details || entry.action,
  }));
}

export async function fetchCoupons(): Promise<Array<{ code: string; discount: string; redemptions: string; expiry: string }>> {
  const db = await staffDb();
  const { data, error } = await db.from("coupons")
    .select("code, discount, discount_description, redemptions_count, max_redemptions, expires_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);

  return (data || []).map((coupon: any) => ({
    code: coupon.code,
    discount: coupon.discount || coupon.discount_description || "Offer",
    redemptions: `${coupon.redemptions_count ?? 0} / ${coupon.max_redemptions ?? 250}`,
    expiry: coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  }));
}

export async function fetchPaymentVerificationRequests(): Promise<PaymentVerificationRequest[]> {
  const db = await staffDb();
  const { data, error } = await db.from("payment_verification_requests")
    .select("id, business_id, requested_by, requested_plan, requested_cycle, rail, transaction_reference, receipt_name, receipt_content_type, status, submitted_at, reviewed_at, rejection_reason")
    .order("submitted_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  const requests = data || [];
  const businessIds = [...new Set(requests.map((request: any) => request.business_id))];
  const { data: businesses, error: businessesError } = businessIds.length
    ? await db.from("businesses").select("id, name").in("id", businessIds)
    : { data: [], error: null };
  if (businessesError) throw new Error(businessesError.message);

  const namesByBusiness = new Map((businesses || []).map((business: any) => [business.id, business.name]));
  const requestedByIds = [...new Set(requests.map((request: any) => request.requested_by))];
  const users = await Promise.all(requestedByIds.map(async (requestedBy) => {
    const { data: userResult, error: userError } = await db.auth.admin.getUserById(requestedBy);
    if (userError) throw new Error(userError.message);
    return [requestedBy, userResult.user?.user_metadata?.full_name || userResult.user?.email || "Unknown subscriber"] as const;
  }));
  const namesByUser = new Map(users);

  return requests.map((request: any) => ({
    id: request.id,
    businessName: namesByBusiness.get(request.business_id) || "Unknown business",
    subscriberName: namesByUser.get(request.requested_by) || "Unknown subscriber",
    requestedPlan: request.requested_plan,
    requestedCycle: request.requested_cycle,
    rail: request.rail,
    transactionReference: request.transaction_reference,
    receiptName: request.receipt_name,
    receiptContentType: request.receipt_content_type,
    status: request.status,
    submittedAt: request.submitted_at,
    reviewedAt: request.reviewed_at,
    rejectionReason: request.rejection_reason,
  }));
}

export async function createCouponAction(formData: FormData | { code: string; discount: string; expiresAt?: string }) {
  const source = formData instanceof FormData
    ? { code: String(formData.get("code") || ""), discount: String(formData.get("discount") || ""), expiresAt: String(formData.get("expiresAt") || "") || undefined }
    : formData;
  const code = source.code.trim();
  const discount = source.discount.trim();
  if (!code || !discount) return { ok: false, message: "Code and discount are required." };

  try {
    const db = await staffDb();
    const { error } = await db.from("coupons").insert({
      code: code.toUpperCase(),
      discount,
      discount_description: discount,
      redemptions_count: 0,
      max_redemptions: 250,
      expires_at: source.expiresAt || null,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/staff");
    return { ok: true, code: code.toUpperCase(), discount, message: "Coupon created." };
  } catch (error) {
    return { ok: false, message: actionError(error) };
  }
}

export async function toggleFeatureFlagAction(flagKey: string, isEnabled: boolean) {
  try {
    const key = flagKeys.parse(flagKey);
    const db = await staffDb();
    const { error } = await db.from("feature_flags").upsert({
      key,
      name: key,
      description: key,
      target_plan: "all",
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    revalidatePath("/staff");
    return { ok: true, message: `${key} ${isEnabled ? "enabled" : "disabled"}.` };
  } catch (error) {
    return { ok: false, message: actionError(error) };
  }
}

export async function sendBroadcastAction(audience: string, message: string) {
  const body = message.trim();
  if (!body) return { ok: false, message: "Message cannot be empty." };

  try {
    const db = await staffDb();
    const { error } = await db.from("broadcasts").insert({ audience, message: body, sent_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    revalidatePath("/staff");
    return { ok: true, message: "Announcement sent to the selected audience." };
  } catch (error) {
    return { ok: false, message: actionError(error) };
  }
}

export async function resolvePaymentVerificationAction(requestId: string, decision: "approve" | "reject", rejectionReason?: string) {
  try {
    const values = paymentDecisionSchema.parse({ requestId, decision, rejectionReason });
    if (values.decision === "reject" && !values.rejectionReason) {
      return { ok: false, message: "A rejection reason is required." };
    }

    const db = await staffDb();
    const { data, error } = await (db as any).rpc("resolve_payment_verification_request", {
      request_id: values.requestId,
      decision: values.decision,
      rejection_reason_input: values.decision === "reject" ? values.rejectionReason : null,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/staff");
    revalidatePath("/dashboard", "layout");
    return { ok: true, status: data as "approved" | "rejected", message: values.decision === "approve" ? "Payment verified and plan activated." : "Payment rejected and business remains on Khata." };
  } catch (error) {
    return { ok: false, message: actionError(error) };
  }
}


export async function lockStaffConsoleAction() {
  (await cookies()).delete(staffAccessCookieName);
  redirect("/staff");
}

