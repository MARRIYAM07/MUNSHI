import { requireMember, requireUser } from "@/lib/supabase";

export type DashboardRole = "owner" | "member";

export async function resolveDashboardBusiness() {
  const { db, user } = await requireUser();
  const { data } = await db
    .from("team_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.business_id) {
    throw new Response("Forbidden", { status: 403 });
  }

  return {
    businessId: data.business_id,
    role: data.role as DashboardRole,
    user,
    db,
  };
}

export async function getDashboardSession() {
  const { businessId } = await resolveDashboardBusiness();
  return requireMember(businessId);
}

export function formatMoney(minor: number | null | undefined): string {
  const amount = Math.round(Number(minor ?? 0) / 100);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export function formatMonth(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export function getStatusTone(status: string | null | undefined): "ok" | "review" | "learned" | "high" | "med" | "low" {
  if (status === "review") return "review";
  if (status === "learned") return "learned";
  if (status === "high") return "high";
  if (status === "med") return "med";
  if (status === "low") return "low";
  return "ok";
}
