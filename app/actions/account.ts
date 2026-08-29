"use server";

import { redirect } from "next/navigation";
import { adminDb, requireUser, userDb } from "@/lib/supabase";

export type DeleteAccountState = {
  error: string;
};

export async function deleteAccount(_previousState: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const businessId = typeof formData.get("business_id") === "string" ? String(formData.get("business_id")) : "";

  if (!password) return { error: "Enter your current password to continue." };

  const { db, user } = await requireUser();
  const { error: reauthError } = await db.auth.signInWithPassword({ email: user.email ?? "", password });
  if (reauthError) return { error: "That password is incorrect." };

  const { data: memberships, error: membershipError } = await db
    .from("team_members")
    .select("business_id,role")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (membershipError) throw membershipError;
  if (!memberships?.some((membership) => membership.business_id === businessId)) {
    return { error: "Your active workspace membership could not be verified." };
  }

  const ownedBusinessIds: string[] = [];
  for (const membership of memberships ?? []) {
    if (membership.role !== "owner") continue;
    const { count, error: memberError } = await db
      .from("team_members")
      .select("user_id", { count: "exact", head: true })
      .eq("business_id", membership.business_id)
      .eq("status", "active")
      .neq("user_id", user.id);
    if (memberError) throw memberError;
    if ((count ?? 0) > 0) {
      return { error: "Remove or transfer all active team members before deleting the owner account." };
    }
    ownedBusinessIds.push(membership.business_id);
  }

  const admin = adminDb();
  const { error: transactionError } = await admin.from("transactions").delete().eq("user_id", user.id);
  if (transactionError) throw transactionError;
  if (ownedBusinessIds.length > 0) {
    const { error: businessError } = await admin.from("businesses").delete().in("id", ownedBusinessIds);
    if (businessError) throw businessError;
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) throw deleteError;

  const sessionDb = await userDb();
  await sessionDb.auth.signOut();
  redirect("/login");
}
