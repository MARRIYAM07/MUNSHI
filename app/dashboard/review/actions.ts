"use server";
import { revalidatePath } from "next/cache";
import { resolveDashboardBusiness } from "@/lib/dashboard";

export async function approveStaging(stagingId: string, categoryId: string) {
  const { db, businessId, user } = await resolveDashboardBusiness();

  const { data: staged, error: fetchError } = await db
    .from("staging_transactions")
    .select("*")
    .eq("id", stagingId)
    .eq("business_id", businessId)
    .single();

  if (fetchError || !staged) throw new Error("Staged transaction not found");

  const { error: insertError } = await db.from("transactions").insert({
    business_id: businessId,
    user_id: staged.user_id,
    occurred_at: staged.occurred_at,
    description: staged.description,
    amount_minor: staged.amount_minor,
    currency: staged.currency,
    direction: staged.direction,
    source_provider: staged.provider,
    raw_source_id: staged.source_id,
    category_id: categoryId || null,
    confidence: "high", // human-approved
    status: "ok",
  });

  if (insertError) throw new Error(insertError.message);

  const { error: updateError } = await db
    .from("staging_transactions")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("id", stagingId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/dashboard/review");
  revalidatePath("/dashboard/overview");
  revalidatePath("/dashboard/categorize");
}

export async function rejectStaging(stagingId: string) {
  const { db, businessId } = await resolveDashboardBusiness();

  const { error } = await db
    .from("staging_transactions")
    .update({ status: "failed", error: "Rejected by user", processed_at: new Date().toISOString() })
    .eq("id", stagingId)
    .eq("business_id", businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/review");
}