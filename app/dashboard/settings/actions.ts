"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/supabase";

export async function saveWhatsappSettings(formData: FormData) {
  const businessId = String(formData.get("business_id") ?? "").trim();
  const forwardingNumber = String(formData.get("forwarding_number") ?? "").trim();

  if (!businessId) {
    throw new Error("Business is required");
  }

  const { db } = await requireMember(businessId);
  const { data: row, error: readError } = await db
    .from("connected_accounts")
    .select("id,metadata,status,enabled")
    .eq("business_id", businessId)
    .eq("provider", "whatsapp")
    .maybeSingle();

  if (readError) throw readError;

  const metadata = row && typeof row.metadata === "object" && row.metadata && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {};

  const nextMetadata = {
    ...metadata,
    forwarding_number: forwardingNumber,
    forwardingNumber,
  };

  const { error } = await db.from("connected_accounts").upsert(
    {
      business_id: businessId,
      provider: "whatsapp",
      status: row?.status ?? "disconnected",
      enabled: row?.enabled ?? false,
      metadata: nextMetadata,
    },
    { onConflict: "business_id,provider" },
  );

  if (error) throw error;
  revalidatePath("/dashboard/settings");
}
