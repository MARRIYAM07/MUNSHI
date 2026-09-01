import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { serverEnv } from "@/lib/env";

export async function userDb() {
  const env = serverEnv();
  const jar = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => jar.getAll(), setAll: (values) => { try { values.forEach(({name,value,options}) => jar.set(name,value,options)); } catch {} } },
  });
}

export function adminDb() {
  const env = serverEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false, autoRefreshToken:false } });
}

export async function requireUser() {
  const db = await userDb();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new Response("Unauthorized", { status:401 });
  return { db, user };
}

export async function requireMember(businessId:string) {
  const { db, user } = await requireUser();
  const { data } = await db.from("team_members").select("role").eq("business_id",businessId).eq("user_id",user.id).eq("status","active").maybeSingle();
  if (!data) throw new Response("Forbidden", {status:403});
  return { db, user, role: data.role as "owner"|"member" };
}
