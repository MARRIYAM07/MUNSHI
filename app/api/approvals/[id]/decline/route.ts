import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { requireMember, requireUser } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { db } = await requireUser();
    const { data: approval, error: approvalError } = await db
      .from("approvals")
      .select("business_id")
      .eq("id", id)
      .maybeSingle();

    if (approvalError) throw approvalError;
    if (!approval) throw new Response("Approval not found", { status: 404 });

    const { db: memberDb } = await requireMember(approval.business_id);
    const { error } = await memberDb.from("approvals").update({ status: "declined" }).eq("id", id).select("id").single();
    if (error) throw error;
    return NextResponse.redirect(new URL("/dashboard/approvals", request.url));
  } catch (error) {
    return apiError(error);
  }
}
