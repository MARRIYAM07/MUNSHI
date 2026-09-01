import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { requireStaffAccess } from "@/lib/staff-access";
import { adminDb } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(await params);
    await requireStaffAccess();
    const admin = adminDb();
    const { data: payment, error: paymentError } = await admin.from("payment_verification_requests")
      .select("id, business_id, transaction_reference, receipt_path")
      .eq("id", id)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return NextResponse.json({ error: "Payment verification request not found." }, { status: 404 });

    const { data: signedReceipt, error: signedReceiptError } = await admin.storage
      .from("payment-receipts")
      .createSignedUrl(payment.receipt_path, 60);
    if (signedReceiptError || !signedReceipt?.signedUrl) throw signedReceiptError || new Error("Receipt preview is unavailable.");

    const { error: auditError } = await admin.from("audit_logs").insert({
      actor_name: "Staff access code",
      action: "Previewed manual payment receipt",
      details: `Business ${payment.business_id} · request ${payment.id} · reference ${payment.transaction_reference}`,
    });
    if (auditError) throw auditError;

    return NextResponse.json(
      { url: signedReceipt.signedUrl },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
