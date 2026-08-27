"use client";

import { useState } from "react";
import { signIn } from "@/app/actions/auth";

export function LoginForm({ error, next }: { error?: string; next?: string }) {
  const [mode, setMode] = useState<"individual" | "member">("individual");
  return <form action={signIn}>
    <input type="hidden" name="next" value={next}/>
    <div className="mode-tabs"><button type="button" className={mode === "individual" ? "active" : ""} onClick={() => setMode("individual")}>Individual / Owner</button><button type="button" className={mode === "member" ? "active" : ""} onClick={() => setMode("member")}>Team member</button></div>
    <div className="hint-box">{mode === "individual" ? "Log in here if you're on Khata or Munshi Pro, or if you're the owner of a Munshi Teams account. Owners can see every team member's ledger." : "Log in here if you were invited to a Munshi Teams workspace. You'll only ever see your own ledger — not your teammates'."}</div>
    {mode === "individual" ? <div className="form-field"><label>Account type</label><select defaultValue="solo"><option value="solo">Individual — Khata or Munshi Pro</option><option value="owner">Team owner — Munshi Teams</option></select></div> : <div className="form-field"><label>Workspace</label><select defaultValue=""><option value="" disabled>Select your workspace after login</option></select></div>}
    <div className="form-field"><label>Email</label><input name="email" type="email" placeholder="you@business.com" required/></div>
    <div className="form-field"><label>Password</label><input name="password" type="password" placeholder="Your password" required/></div>
    {error ? <p className="auth-error" role="alert">{error}</p> : null}
    <button className="auth-submit" type="submit">Log in →</button>
    <div className="auth-links"><a href="/signup">Open a new ledger</a><a href="#">Forgot password?</a></div>
  </form>;
}
