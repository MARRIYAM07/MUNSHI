import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function apiError(error:unknown) {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) return NextResponse.json({error:"Invalid request",issues:error.issues},{status:400});
  console.error(error);
  return NextResponse.json({error:"Internal server error"},{status:500});
}
export function bearer(request:Request) { const h=request.headers.get("authorization"); return h?.startsWith("Bearer ") ? h.slice(7) : null; }
