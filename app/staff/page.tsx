import "./staff.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StaffConsoleClient } from "./StaffConsoleClient";
import {
  createStaffAccessSession,
  hasStaffAccess,
  isValidStaffAccessCode,
  staffAccessCookieName,
  staffAccessCookieOptions,
} from "@/lib/staff-access";

async function unlockStaffConsole(formData: FormData) {
  "use server";

  const accessCode = String(formData.get("accessCode") || "");
  if (!isValidStaffAccessCode(accessCode)) {
    redirect("/staff?error=invalid");
  }

  (await cookies()).set(staffAccessCookieName, createStaffAccessSession(), staffAccessCookieOptions);
  redirect("/staff");
}

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await hasStaffAccess()) {
    return <StaffConsoleClient staffEmail="Staff" />;
  }

  const { error } = await searchParams;

  return (
    <main className="staff-access">
      <section className="staff-access-card" aria-labelledby="staff-access-title">
        <div className="staff-access-accent" />
        <header className="staff-access-header">
          <span className="staff-access-kicker">Munshi Internal</span>
          <h1 id="staff-access-title">Staff Console</h1>
          <p>Enter the staff access passphrase to continue.</p>
        </header>

        {error === "invalid" && (
          <p className="staff-access-error" role="alert">
            Invalid access code. Please try again.
          </p>
        )}

        <form action={unlockStaffConsole} className="staff-access-form">
          <label htmlFor="staff-access-code">Access code</label>
          <input
            id="staff-access-code"
            name="accessCode"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            placeholder="••••••••••••"
          />
          <button type="submit">Enter Console</button>
        </form>

        <a className="staff-access-home" href="/">Back to munshi.pk</a>
      </section>
    </main>
  );
}