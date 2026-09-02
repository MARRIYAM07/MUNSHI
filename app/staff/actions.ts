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

const expiryReminderSchema = z.object({
  businessId: z.string().optional().or(z.literal("")).or(z.null()),
  phone: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  planName: z.string().trim().min(1),
});

const paymentWhatsAppSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  customerPhone: z.string().trim().min(1),
  planName: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
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

function cleanPhoneNumber(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
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
  let request = (db as any).from("businesses")
    .select("id, owner_user_id, name, plan, subscriptions(status, current_period_end)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (selectedPlan) request = request.eq("plan", selectedPlan);

  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const term = (query || "").trim().toLowerCase();
  const subscribers: StaffSubscriber[] = await Promise.all((data || []).map(async (business: any, index: number): Promise<StaffSubscriber> => {
    const subscription = Array.isArray(business.subscriptions) ? business.subscriptions[0] : business.subscriptions;
    const name = business.name || "Unknown business";
    const planValue = String(business.plan || "khata").toUpperCase();
    const statusValue = String(subscription?.status || "inactive").toUpperCase();
    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "—";
    let email = "—";

    if (business.owner_user_id) {
      const { data: userResult, error: userError } = await db.auth.admin.getUserById(business.owner_user_id);
      if (userError) throw new Error(userError.message);
      email = userResult.user?.email || "—";
    }

    return {
      id: index + 1,
      name,
      email,
      initials: initials(name),
      plan: planValue === "PRO" ? "PRO" : planValue === "TEAMS" ? "TEAMS" : "KHATA",
      status: statusValue === "EXPIRED" || statusValue === "INACTIVE" ? "EXPIRED" : "ACTIVE",
      renewal: periodEnd,
      txn: "—",
      mrr: "—",
    };
  }));

  return subscribers.filter((row) => !term || row.name.toLowerCase().includes(term));
}

export async function fetchSubscribersAction(query?: string, plan?: string) {
  return fetchSubscribers(query, plan);
}

export async function fetchSupportTickets(): Promise<Array<{ priority: string; name: string; description: string; subject: string; user_email: string; key: string }>> {
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
    subject: ticket.issue || "Support request",
    user_email: "",
    key: String(ticket.priority || "medium").toLowerCase(),
  }));
}

export async function fetchFeatureFlags(): Promise<Record<string, boolean>> {
  const db = await staffDb();
  const { data, error } = await (db as any).from("staff_feature_flags").select("key, enabled");
  if (error) throw new Error(error.message);

  return (data || []).reduce((result: Record<string, boolean>, flag: any) => {
    result[flag.key] = Boolean(flag.enabled);
    return result;
  }, {});
}

export async function fetchAuditLogs(): Promise<Array<{ actor: string; time: string; detail: string }>> {
  const db = await staffDb();
  const { data, error } = await (db as any).from("staff_audit_logs")
    .select("actor, action, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw new Error(error.message);

  return (data || []).map((entry: any) => ({
    actor: entry.actor || "System",
    time: new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    detail: entry.detail || entry.action,
  }));
}

export async function fetchCoupons(): Promise<Array<{ code: string; discount: string; redemptions: string; expiry: string }>> {
  const db = await staffDb();
  const { data, error } = await (db as any).from("coupons")
    .select("code, discount, redemptions, expires_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);

  return (data || []).map((coupon: any) => ({
    code: coupon.code,
    discount: coupon.discount,
    redemptions: coupon.redemptions || "0 / 250",
    expiry: coupon.expires_at,
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

export async function createCouponAction(formData: FormData | { code: string; discount: string; maxUses?: number; expiresAt?: string }) {
  const source = formData instanceof FormData
    ? { code: String(formData.get("code") || ""), discount: String(formData.get("discount") || ""), maxUses: Number(formData.get("maxUses") || 250), expiresAt: String(formData.get("expiresAt") || "") || undefined }
    : formData;
  const code = source.code.trim();
  const discount = source.discount.trim();
  const maxUses = source.maxUses || 250;
  const expiresAt = source.expiresAt?.trim() || "";
  if (!code || !discount) return { ok: false, message: "Code and discount are required." };
  if (!Number.isInteger(maxUses) || maxUses < 1) return { ok: false, message: "Max uses must be at least 1." };
  if (!expiresAt) return { ok: false, message: "Expiry is required." };

  try {
    const db = await staffDb();
    const { error } = await (db as any).from("coupons").insert({
      code: code.toUpperCase(),
      discount,
      redemptions: `0 / ${maxUses}`,
      expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);
    const { error: auditError } = await (db as any).from("staff_audit_logs").insert({
      actor: "Staff access code",
      action: "Created coupon",
      detail: `Created coupon ${code.toUpperCase()}`,
    });
    if (auditError) throw new Error(auditError.message);
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
    const { error } = await (db as any).from("staff_feature_flags").upsert({
      key,
      enabled: isEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    const { error: auditError } = await (db as any).from("staff_audit_logs").insert({
      actor: "Staff access code",
      action: `${isEnabled ? "Enabled" : "Disabled"} feature flag`,
      detail: `${key} ${isEnabled ? "enabled" : "disabled"}`,
    });
    if (auditError) throw new Error(auditError.message);
    revalidatePath("/staff");
    return { ok: true, message: `${key} ${isEnabled ? "enabled" : "disabled"}.` };
  } catch (error) {
    return { ok: false, message: actionError(error) };
  }
}

export async function sendBroadcastAction(input: { audience: string; message: string } | string, legacyMessage?: string) {
  const audience = typeof input === "string" ? input : input.audience;
  const message = typeof input === "string" ? legacyMessage || "" : input.message;
  const body = message.trim();
  if (!body) return { ok: false, message: "Message cannot be empty." };

  try {
    const db = await staffDb();
    const audiencePlans: Record<string, string> = {
      "Khata (Free) only": "khata",
      "Pro only": "pro",
      "Teams only": "teams",
    };
    let businessIds: string[] | null = null;
    if (audience === "Renewing in 7 days") {
      const { data: renewingSubscriptions, error: subscriptionError } = await db
        .from("subscriptions")
        .select("business_id")
        .gte("current_period_end", new Date().toISOString())
        .lte("current_period_end", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
      if (subscriptionError) throw new Error(subscriptionError.message);
      businessIds = (renewingSubscriptions || []).map((subscription) => subscription.business_id);
    }

    let recipients = db
      .from("team_members")
      .select("business_id, user_id, businesses!inner(plan)")
      .eq("status", "active");

    if (audiencePlans[audience]) {
      recipients = recipients.eq("businesses.plan", audiencePlans[audience] as "khata" | "pro" | "teams");
    }
    if (businessIds) {
      recipients = recipients.in("business_id", businessIds);
    }

    const { data: members, error: recipientsError } = await recipients;
    if (recipientsError) throw new Error(recipientsError.message);

    const notifications = (members || []).map((member: any) => ({
      business_id: member.business_id,
      user_id: member.user_id,
      type: "team" as const,
      title: "Munshi Announcement",
      body,
    }));
    if (notifications.length) {
      const { error: notificationError } = await db.from("notifications").insert(notifications);
      if (notificationError) throw new Error(notificationError.message);
    }

    const { error: broadcastError } = await db.from("broadcasts").insert({ audience, message: body, sent_at: new Date().toISOString() });
    if (broadcastError) throw new Error(broadcastError.message);
    const { error: auditError } = await (db as any).from("staff_audit_logs").insert({
      actor: "Staff access code",
      action: "Sent broadcast",
      detail: `Sent broadcast to ${audience}: ${body}`,
    });
    if (auditError) throw new Error(auditError.message);
    revalidatePath("/staff");
    return { ok: true, message: "Announcement sent to the selected audience." };
  } catch (error) {
    return { ok: false, message: actionError(error) };
  }
}

export async function sendExpiryReminderAction(input: { businessId?: string | null; phone: string; customerName: string; planName: string }) {
  try {
    const values = expiryReminderSchema.parse(input);
    const cleanPhone = cleanPhoneNumber(values.phone);
    if (!cleanPhone) return { ok: false, message: "A valid phone number is required." };

    const db = await staffDb();
    const notificationBusinessId = typeof values.businessId === "string" && z.string().uuid().safeParse(values.businessId).success
      ? values.businessId
      : null;
    if (notificationBusinessId) {
      const { error: notificationError } = await db.from("notifications").insert({
        business_id: notificationBusinessId,
        type: "alert",
        title: "Subscription Renewal Notice",
        body: "Your Munshi plan is expiring soon.",
      });
      if (notificationError) throw new Error(notificationError.message);
    }

    const { error: auditError } = await (db as any).from("staff_audit_logs").insert({
      actor: "Staff access code",
      action: "Issued subscription expiry reminder",
      detail: `Issued ${values.planName} expiry reminder to ${values.customerName}`,
    });
    if (auditError) throw new Error(auditError.message);

    const message = `Assalam-o-alaikum ${values.customerName}, your Munshi ${values.planName} subscription is expiring soon. Please renew your plan to continue uninterrupted ledger tracking.`;
    return { ok: true, waLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` };
  } catch (error) {
    return { ok: false, message: actionError(error) };
  }
}

export async function resolvePaymentWithWhatsAppAction(input: {
  requestId: string;
  decision: "approve" | "reject";
  customerPhone: string;
  planName: string;
  reason?: string;
}) {
  try {
    const values = paymentWhatsAppSchema.parse(input);
    if (values.decision === "reject" && !values.reason) {
      return { ok: false, message: "A rejection reason is required." };
    }

    const cleanPhone = cleanPhoneNumber(values.customerPhone);
    if (!cleanPhone) return { ok: false, message: "A valid phone number is required." };

    const db = await staffDb();
    const { data, error } = await (db as any).rpc("resolve_payment_verification_request", {
      request_id: values.requestId,
      decision: values.decision,
      rejection_reason_input: values.decision === "reject" ? values.reason : null,
    });
    if (error) throw new Error(error.message);

    const message = values.decision === "approve"
      ? `Assalam-o-alaikum! Your payment for Munshi ${values.planName} has been verified and activated. Thank you!`
      : `Assalam-o-alaikum. Your payment verification for Munshi was declined. Reason: ${values.reason || "Invalid transaction proof"}. Please reply with the updated proof.`;
    const { error: auditError } = await (db as any).from("staff_audit_logs").insert({
      actor: "Staff access code",
      action: values.decision === "approve" ? "Approved payment with WhatsApp follow-up" : "Rejected payment with WhatsApp follow-up",
      detail: `Payment request ${values.requestId} ${values.decision} for Munshi ${values.planName}`,
    });
    if (auditError) throw new Error(auditError.message);

    revalidatePath("/staff");
    revalidatePath("/dashboard", "layout");
    return { ok: true, status: data as "approved" | "rejected", waLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` };
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
