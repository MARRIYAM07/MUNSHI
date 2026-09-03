"use server";
import { revalidatePath } from "next/cache";
import { resolveDashboardBusiness } from "@/lib/dashboard";

export async function createManualTransaction(formData: FormData) {
  const { db, user, businessId } = await resolveDashboardBusiness();

  const amountRupees = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string)?.trim();
  const occurredAt = formData.get("date") as string;
  const direction = formData.get("direction") as string;

  if (!amountRupees || amountRupees <= 0) throw new Error("Enter a valid amount");
  if (!description) throw new Error("Description is required");
  if (!occurredAt) throw new Error("Date is required");
  if (direction !== "credit" && direction !== "debit") throw new Error("Invalid type");

  const { data: business } = await db
    .from("businesses")
    .select("currency")
    .eq("id", businessId)
    .single();

  const { error } = await db.from("transactions").insert({
    business_id: businessId,
    user_id: user.id,
    occurred_at: new Date(occurredAt).toISOString(),
    description,
    amount_minor: Math.round(amountRupees * 100),
    currency: business?.currency ?? "PKR",
    direction,
    source_provider: "manual",
    raw_source_id: `manual-${crypto.randomUUID()}`,
    confidence: "high",
    status: "ok",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/overview");
  revalidatePath("/dashboard/transactions");
}