"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userDb } from "@/lib/supabase";

type Plan = "khata" | "pro" | "teams";
type Cycle = "monthly" | "yearly";

function value(formData: FormData, key: string) {
  const result = formData.get(key);
  return typeof result === "string" ? result.trim() : "";
}

function planFrom(value: string): Plan {
  return value === "pro" || value === "teams" ? value : "khata";
}

function cycleFrom(value: string): Cycle {
  return value === "yearly" ? value : "monthly";
}

function destination(plan: Plan, cycle: Cycle) {
  return plan === "khata" ? "/dashboard" : `/payment?plan=${plan}&cycle=${cycle}`;
}

function queryPlan(plan: Plan) {
  return plan === "khata" ? "free" : plan;
}

async function createBusiness(db: Awaited<ReturnType<typeof userDb>>, plan: Plan, cycle: Cycle, businessName: string, currency: string, memberEmails: string[]) {
  const { data: businessId, error } = await db.rpc("create_business", {
    business_name: businessName,
    business_currency: currency || "PKR",
    business_plan: plan,
    cycle,
  });
  if (error || !businessId) {
    console.error("create_business failed", { code: error?.code, details: error?.details, hint: error?.hint, message: error?.message, plan, cycle });
    throw new Error(error?.message ?? "Could not create your business");
  }

  if (memberEmails.length) {
    const { error: membersError } = await db.from("team_members").insert(
      memberEmails.map((invited_email) => ({ business_id: businessId, invited_email, role: "member", status: "pending" })),
    );
    if (membersError) {
      console.error("Creating pending team members failed", { code: membersError.code, details: membersError.details, hint: membersError.hint, message: membersError.message });
      throw new Error(membersError.message);
    }
  }
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const next = value(formData, "next");
  const db = await userDb();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signUp(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const businessName = value(formData, "business_name");
  const currency = value(formData, "currency") || "PKR";
  const plan = planFrom(value(formData, "plan"));
  const cycle = cycleFrom(value(formData, "cycle"));
  const memberEmails = formData.getAll("member_email").filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim()).slice(0, 4);

  if (!email || !password || !businessName) redirect(`/signup?plan=${queryPlan(plan)}&cycle=${cycle}&error=Please+complete+the+required+fields`);

  const origin = (await headers()).get("origin");
  if (!origin) throw new Error("Could not determine the application origin");
  const confirmationUrl = new URL("/auth/confirm", origin);
  confirmationUrl.searchParams.set("plan", queryPlan(plan));
  confirmationUrl.searchParams.set("cycle", cycle);
  const db = await userDb();
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmationUrl.toString(),
      data: { business_name: businessName, currency, plan, cycle, member_emails: memberEmails },
    },
  });
  if (error) redirect(`/signup?plan=${queryPlan(plan)}&cycle=${cycle}&error=${encodeURIComponent(error.message)}`);

  if (!data.session) redirect(`/signup/check-email?plan=${queryPlan(plan)}&cycle=${cycle}`);
  await createBusiness(db, plan, cycle, businessName, currency, memberEmails);
  redirect(destination(plan, cycle));
}

export async function signOut() {
  const db = await userDb();
  await db.auth.signOut();
  redirect("/login");
}
