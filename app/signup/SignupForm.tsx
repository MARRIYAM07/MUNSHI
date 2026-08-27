"use client";

import { useState } from "react";
import { signUp } from "@/app/actions/auth";

type Plan = "free" | "pro" | "teams";
type Cycle = "monthly" | "yearly";
const plans: { id: Plan; tag: string; title: string; monthly: string; yearly?: string; features: string[] }[] = [
  { id: "free", tag: "Starter", title: "Khata", monthly: "$0", features: ["Up to 25 transactions/mo", "Statement & screenshot ingestion", "Monthly PDF export", "1 person"] },
  { id: "pro", tag: "Freelancer", title: "Munshi Pro", monthly: "$10 /mo", yearly: "$8 /mo", features: ["Unlimited transactions", "Merchant-learning categorization", "Client due-date reminders", "1 person"] },
  { id: "teams", tag: "Small Business", title: "Munshi Teams", monthly: "$30 /mo", yearly: "$25 /mo", features: ["Everything in Pro", "Owner + up to 4 team members", "Owner sees all members' ledgers", "Members' data stays private"] },
];

export function SignupForm({ initialPlan, initialCycle, error }: { initialPlan: Plan; initialCycle: Cycle; error?: string }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [cycle, setCycle] = useState<Cycle>(initialCycle);
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<number[]>([]);
  const note = plan === "free" ? "Khata — free forever, up to 25 transactions a month, one person." : plan === "pro" ? `Munshi Pro — ${cycle === "monthly" ? "$10/month" : "$100/year (2 months free)"}, unlimited transactions, one person.` : `Munshi Teams — ${cycle === "monthly" ? "$30/month" : "$300/year (2 months free)"}, owner + up to 4 team members.`;
  return <>
    <div className="signup-steps"><span className={step === 1 ? "active" : ""}>1 · Plan</span><span className={step === 2 ? "active" : ""}>2 · Your details</span><span>3 · Done</span></div>
    <div className="signup-panels"><section className={step === 1 ? "active" : ""}>
      <div className="billing"><button type="button" className={cycle === "monthly" ? "active" : ""} onClick={() => setCycle("monthly")}>Monthly</button><button type="button" className={cycle === "yearly" ? "active" : ""} onClick={() => setCycle("yearly")}>Yearly <small>2 months free</small></button></div>
      <div className="plan-grid">{plans.map((item) => <button type="button" key={item.id} className={`plan-card ${plan === item.id ? "selected" : ""}`} onClick={() => setPlan(item.id)}><i>✓</i><b>{item.tag}</b><h3>{item.title}</h3><strong>{cycle === "yearly" && item.yearly ? item.yearly : item.monthly}</strong>{item.id !== "free" ? <small>{cycle === "monthly" ? "billed monthly" : item.id === "pro" ? "billed $100/year" : "billed $300/year"}</small> : null}<ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></button>)}</div>
      <div className="plan-actions"><button className="auth-button solid" type="button" onClick={() => setStep(2)}>Continue →</button></div>
    </section>
    <section className={step === 2 ? "active" : ""}><form action={signUp}>
      <input type="hidden" name="plan" value={plan}/><input type="hidden" name="cycle" value={cycle}/>
      <div className="signup-form-card"><div className="hint-box">{note}</div><div className="form-field"><label>Your name</label><input name="name" placeholder="e.g. Amna Khan" required/></div><div className="form-field"><label>Business / work name</label><input name="business_name" placeholder="e.g. Bright Studio" required/></div><div className="form-row"><div className="form-field"><label>City</label><input name="city" placeholder="e.g. Lahore"/></div><div className="form-field"><label>Currency clients pay you in</label><select name="currency" defaultValue="PKR"><option>PKR</option><option>USD</option><option>GBP</option><option>EUR</option><option>AED</option><option>CAD</option></select></div></div>
      {plan === "teams" ? <div className="team-fields"><div className="form-field"><label>How do you plan to use Munshi?</label><textarea name="usage" rows={3} placeholder="e.g. Tracking income across 4 freelancers and reconciling client payouts each month"/></div><div className="hint-box">Add up to 4 team members now, or skip and invite them later from your owner console. Each gets their own login — they&apos;ll only ever see their own ledger.</div>{members.map((id, index) => <div className="member-row" key={id}><button type="button" onClick={() => setMembers(members.filter((member) => member !== id))}>× remove</button><b>Team member {index + 1}</b><div className="form-row"><div className="form-field"><label>Name</label><input name="member_name" placeholder="e.g. Bilal Ahmed"/></div><div className="form-field"><label>Email</label><input name="member_email" type="email" placeholder="bilal@business.com"/></div></div><div className="form-field"><label>Set a password for them</label><input type="password" placeholder="Temporary password"/></div></div>)}{members.length < 4 ? <button className="auth-button small" type="button" onClick={() => setMembers([...members, Date.now()])}>+ Add {members.length ? "another" : "team member"}</button> : null}</div> : null}
      <div className="form-field"><label>Email</label><input name="email" type="email" placeholder="you@business.com" required/></div><div className="form-field"><label>Password</label><input name="password" type="password" placeholder="Create a password" minLength={6} required/></div>{error ? <p className="auth-error" role="alert">{error}</p> : null}</div><div className="signup-actions"><button className="auth-button" type="button" onClick={() => setStep(1)}>← Back</button><button className="auth-button solid" type="submit">Open my ledger →</button></div>
    </form></section></div>
  </>;
}
