import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

type Plan = "khata" | "pro" | "teams";
type Cycle = "monthly" | "yearly";

const planFrom = (value: unknown): Plan => value === "pro" || value === "teams" ? value : "khata";
const cycleFrom = (value: unknown): Cycle => value === "yearly" ? value : "monthly";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const response = NextResponse.redirect(new URL("/login", request.url));
  if (!code) return response;

  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/login?error=Confirmation+link+is+invalid+or+expired", request.url));

  const metadata = data.user.user_metadata;
  const plan = planFrom(url.searchParams.get("plan") ?? metadata.plan);
  const cycle = cycleFrom(url.searchParams.get("cycle") ?? metadata.cycle);
  const businessName = typeof metadata.business_name === "string" ? metadata.business_name : "My business";
  const currency = typeof metadata.currency === "string" ? metadata.currency : "PKR";
  const memberEmails = Array.isArray(metadata.member_emails) ? metadata.member_emails.filter((item): item is string => typeof item === "string").slice(0, 4) : [];
  const { data: businessId, error: businessError } = await supabase.rpc("create_business", { business_name: businessName, business_currency: currency, business_plan: plan, cycle });
  if (businessError || !businessId) return NextResponse.redirect(new URL("/signup?error=Could+not+create+your+business", request.url));
  if (memberEmails.length) await supabase.from("team_members").insert(memberEmails.map((invited_email) => ({ business_id: businessId, invited_email, role: "member", status: "pending" })));

  return NextResponse.redirect(new URL(plan === "khata" ? "/dashboard" : `/payment?plan=${plan}&cycle=${cycle}`, request.url));
}
