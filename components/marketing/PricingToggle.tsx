"use client";

import {useState} from "react";

type BillingCycle="monthly"|"yearly";

export function PricingToggle(){
  const[cycle,setCycle]=useState<BillingCycle>("monthly");
  const yearly=cycle==="yearly";

  return <>
    <div className="billing-toggle">
      <button className={yearly?undefined:"active"} type="button" onClick={()=>setCycle("monthly")}>Monthly</button>
      <button className={yearly?"active":undefined} type="button" onClick={()=>setCycle("yearly")}>Yearly <span className="save-tag">2 months free</span></button>
    </div>
    <div className="tariff-grid">
      <article className="tariff-card">
        <div className="tag">Starter</div><h3>Khata</h3>
        <div className="price">$0</div><div className="price-note">forever, no card required</div>
        <ul><li>Up to <strong>25 transactions</strong>/month</li><li>Payoneer &amp; Wise statement reading</li><li>WhatsApp screenshot ingestion</li><li>Monthly summary export (PDF)</li></ul>
        <a className="tariff-cta" href="/signup?plan=free">Start free</a>
      </article>
      <article className="tariff-card pro">
        <div className="pro-ribbon">Most freelancers pick this</div><div className="tag">Freelancer</div><h3>Munshi Pro</h3>
        <div className="price">{yearly?"$8":"$10"} <span>/ month</span></div>
        <div className="price-note">{yearly?"billed $100/year · ~PKR 28,000":"billed monthly, cancel anytime · ~PKR 2,800"}</div>
        <ul><li>Unlimited transactions</li><li>Merchant-learning categorization</li><li>Client due-date tracking &amp; drafted reminders</li><li>Multi-currency reconciliation</li><li>FBR-ready quarterly exports</li></ul>
        <a className="tariff-cta solid" href={`/signup?plan=pro&cycle=${cycle}`}>Request early access</a>
      </article>
      <article className="tariff-card">
        <div className="tag">Small Business</div><h3>Munshi Teams</h3>
        <div className="price">{yearly?"$25":"$30"} <span>/ month</span></div>
        <div className="price-note">{yearly?"billed $300/year · owner + up to 4 team members":"owner + up to 4 team members · ~PKR 8,400"}</div>
        <ul><li>Everything in Freelancer</li><li>Owner sees every member&apos;s ledger</li><li>Members&apos; data stays private from each other</li><li>Accountant hand-off view</li><li>Priority statement processing</li></ul>
        <a className="tariff-cta" href={`/signup?plan=teams&cycle=${cycle}`}>Talk to us</a>
      </article>
    </div>
  </>;
}
