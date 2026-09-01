import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveDashboardBusiness } from "@/lib/dashboard";
import { apiError } from "@/lib/http";
import { billingCycles, paidPlanIds } from "@/lib/plans";
import { receiptExtension, receiptMaxBytes } from "@/lib/payment";
import { adminDb, requireMember } from "@/lib/supabase";

export const runtime = "nodejs";

const payloadSchema = z.object({
  plan: z.enum(paidPlanIds),
  cycle: z.enum(billingCycles),
  rail: z.enum(["jazzcash", "easypaisa", "bank"]),
  phone: z.string().trim().min(5).max(32),
  whatsapp: z.string().trim().max(32),
  transactionId: z.string().trim().min(4).max(128),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = payloadSchema.parse({
      plan: formData.get("plan"),
      cycle: formData.get("cycle"),
      rail: formData.get("rail"),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp") ?? "",
      transactionId: formData.get("transactionId"),
      idempotencyKey: formData.get("idempotencyKey"),
    });
    const receipt = formData.get("receipt");

    if (!(receipt instanceof File)) {
      return NextResponse.json({ error: "Attach a receipt before submitting payment for review." }, { status: 400 });
    }

    const extension = receiptExtension(receipt.type);
    if (!extension) {
      return NextResponse.json({ error: "Receipt must be a PNG, JPG, WEBP, or PDF file." }, { status: 400 });
    }

    if (receipt.size === 0 || receipt.size > receiptMaxBytes) {
      return NextResponse.json({ error: "Receipt must be smaller than 5 MB." }, { status: 400 });
    }

    const { businessId } = await resolveDashboardBusiness();
    const { role, user } = await requireMember(businessId);
    if (role !== "owner") {
      return NextResponse.json({ error: "Only the business owner can submit a payment for verification." }, { status: 403 });
    }

    const db = adminDb();
    const { data: existingRequest, error: existingError } = await db
      .from("payment_verification_requests")
      .select("id, requested_plan, requested_cycle, transaction_reference, submitted_at")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingRequest) {
      return NextResponse.json({
        error: "A payment verification request is already pending for this business.",
        pending: {
          requestedPlan: existingRequest.requested_plan,
          requestedCycle: existingRequest.requested_cycle,
          transactionId: existingRequest.transaction_reference,
          submittedAt: existingRequest.submitted_at,
        },
      }, { status: 409 });
    }

    const requestId = crypto.randomUUID();
    const receiptPath = `${businessId}/${requestId}/receipt.${extension}`;
    const { error: uploadError } = await db.storage.from("payment-receipts").upload(receiptPath, receipt, {
      contentType: receipt.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: createdRequest, error: insertError } = await db.from("payment_verification_requests").insert({
      id: requestId,
      business_id: businessId,
      requested_by: user.id,
      requested_plan: payload.plan,
      requested_cycle: payload.cycle,
      rail: payload.rail,
      transaction_reference: payload.transactionId,
      contact_phone: payload.phone,
      whatsapp: payload.whatsapp || null,
      receipt_path: receiptPath,
      receipt_name: receipt.name,
      receipt_content_type: receipt.type,
      receipt_size: receipt.size,
      idempotency_key: payload.idempotencyKey,
    }).select("submitted_at").single();

    if (insertError) {
      await db.storage.from("payment-receipts").remove([receiptPath]);
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "A payment verification request is already pending for this business." }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({
      request: {
        status: "pending",
        requestedPlan: payload.plan,
        requestedCycle: payload.cycle,
        transactionId: payload.transactionId,
        submittedAt: createdRequest.submitted_at,
      },
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
