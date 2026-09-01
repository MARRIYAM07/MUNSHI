import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const staffAccessCookieName = "munshi_staff_access";

function configuredAccessKey() {
  return process.env.STAFF_ACCESS_KEY || "";
}

function safelyMatches(left: string, right: string) {
  const leftValue = Buffer.from(left);
  const rightValue = Buffer.from(right);
  return leftValue.length === rightValue.length && timingSafeEqual(leftValue, rightValue);
}

function sessionValue(accessKey: string) {
  return createHmac("sha256", accessKey).update("munshi-staff-console").digest("base64url");
}

export function isValidStaffAccessCode(value: string) {
  const accessKey = configuredAccessKey();
  return Boolean(accessKey) && safelyMatches(value, accessKey);
}

export function createStaffAccessSession() {
  const accessKey = configuredAccessKey();
  if (!accessKey) throw new Error("STAFF_ACCESS_KEY is not configured.");
  return sessionValue(accessKey);
}

export async function hasStaffAccess() {
  const accessKey = configuredAccessKey();
  if (!accessKey) return false;

  const token = (await cookies()).get(staffAccessCookieName)?.value;
  if (!token) return false;
  return safelyMatches(token, sessionValue(accessKey));
}

export async function requireStaffAccess() {
  if (!await hasStaffAccess()) {
    throw new Response("Staff access is required.", { status: 403 });
  }
}

export const staffAccessCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 8,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
