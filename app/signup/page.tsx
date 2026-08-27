"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SignupForm } from "./SignupForm";
import "../auth-pages.css";

const validPlan = (value?: string) => value === "free" || value === "pro" || value === "teams" ? value : "pro";
const validCycle = (value?: string) => value === "yearly" ? value : "monthly";

function SignupPageContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? undefined;
  const cycle = searchParams.get("cycle") ?? undefined;
  const error = searchParams.get("error") ?? undefined;
  return <main className="signup-page">
    <nav className="signup-nav"><div><a className="signup-wordmark" href="/"><img src="/munshi-logo.png" alt="Munshi logo"/>MUNSHI<span>.</span></a><a className="signup-back" href="/">← Back to munshi.pk</a></div></nav>
    <header className="signup-hero"><div>Open a ledger</div><h1>Choose your plan</h1><p>Free forever on Khata, or unlock more with Pro and Teams.</p><small>612 Pakistani businesses already keep their books here — 1,840 clients tracked between them.</small></header>
    <SignupForm initialPlan={validPlan(plan)} initialCycle={validCycle(cycle)} error={error}/>
  </main>;
}

export default function SignupPage() {
  return <Suspense fallback={null}><SignupPageContent/></Suspense>;
}
