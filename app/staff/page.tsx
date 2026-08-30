"use client";

import "./staff.css";
import { useEffect, useMemo, useState } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useToast } from "@/components/ui/Toast";
import { verifyStaffPasscode } from "./actions";

type TabKey = "overview" | "subscribers" | "plans" | "coupons" | "broadcast" | "health" | "support" | "flags" | "audit";
type SubscriberPlan = "KHATA" | "PRO" | "TEAMS";
type SubscriberStatus = "ACTIVE" | "EXPIRING" | "EXPIRED";

type Subscriber = {
  id: number;
  name: string;
  email: string;
  initials: string;
  plan: SubscriberPlan;
  status: SubscriberStatus;
  renewal: string;
  txn: string;
  mrr: string;
};

const navItems: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "overview", label: "Overview", icon: "◉" },
  { key: "subscribers", label: "Subscribers", icon: "☰" },
  { key: "plans", label: "Plans & Revenue", icon: "▣" },
  { key: "coupons", label: "Coupons", icon: "✦" },
  { key: "broadcast", label: "Broadcast", icon: "✉" },
  { key: "health", label: "Parsing Health", icon: "⎈" },
  { key: "support", label: "Support", icon: "?" },
  { key: "flags", label: "Feature Flags", icon: "⚑" },
  { key: "audit", label: "Audit Log", icon: "▤" },
];

const overviewKpis = [
  { label: "Total Users", value: "4,218", delta: "+212 this month", tone: "forest" },
  { label: "MRR", value: "$9,640", delta: "+14% vs last month • ~PKR 2.7M", tone: "brass" },
  { label: "Paid Subscribers", value: "742", delta: "17.6% of total users", tone: "forest" },
  { label: "Churn Rate", value: "3.1%", delta: "-0.4pt vs last month", tone: "red" },
];

const growthSeries = [
  { month: "Mar", value: 320 },
  { month: "Apr", value: 420 },
  { month: "May", value: 500 },
  { month: "Jun", value: 610 },
  { month: "Jul", value: 730 },
  { month: "Aug", value: 820 },
];

const planDistribution = [
  { label: "Khata (Free)", share: 82, users: "3,476", color: "#14442f" },
  { label: "Munshi Pro", share: 15, users: "612", color: "#7a8c72" },
  { label: "Munshi Teams", share: 3, users: "130", color: "#d9a94b" },
];

const expiringPlans = [
  { name: "Ayesha Rahman", plan: "Munshi Pro", expiry: "Expiring 12 Sep", avatar: "AR" },
  { name: "Bilal Qureshi", plan: "Teams", expiry: "Expiring 14 Sep", avatar: "BQ" },
  { name: "Naseem Khan", plan: "Pro", expiry: "Expiring 16 Sep", avatar: "NK" },
];

const subscriberRows: Subscriber[] = [
  { id: 1, name: "Ayesha Rahman", email: "ayesha@roseandco.pk", initials: "AR", plan: "PRO", status: "ACTIVE", renewal: "12 Sep 2026", txn: "74", mrr: "$64" },
  { id: 2, name: "Bilal Qureshi", email: "bilal@studioqu.pk", initials: "BQ", plan: "TEAMS", status: "EXPIRING", renewal: "14 Sep 2026", txn: "142", mrr: "$186" },
  { id: 3, name: "Sana Malik", email: "sana@northlane.co", initials: "SM", plan: "KHATA", status: "ACTIVE", renewal: "28 Sep 2026", txn: "12", mrr: "$0" },
  { id: 4, name: "Naseem Khan", email: "naseem@pixelworks.ai", initials: "NK", plan: "PRO", status: "EXPIRED", renewal: "02 Aug 2026", txn: "61", mrr: "$58" },
  { id: 5, name: "Maham Tariq", email: "maham@moonseed.pk", initials: "MT", plan: "PRO", status: "ACTIVE", renewal: "09 Sep 2026", txn: "92", mrr: "$80" },
  { id: 6, name: "Usman Ali", email: "usman@flickercraft.com", initials: "UA", plan: "TEAMS", status: "ACTIVE", renewal: "03 Oct 2026", txn: "228", mrr: "$260" },
];

const revenueMonths = [
  { month: "Mar", value: 5.2 },
  { month: "Apr", value: 6.1 },
  { month: "May", value: 6.9 },
  { month: "Jun", value: 7.8 },
  { month: "Jul", value: 8.1 },
  { month: "Aug", value: 10.0 },
];

const revenueFlow = [
  { from: "Khata → Pro", delta: "+58", tone: "pos" },
  { from: "Pro → Teams", delta: "+11", tone: "pos" },
  { from: "Canceled entirely", delta: "-14", tone: "neg" },
  { from: "Downgrade to Khata", delta: "-7", tone: "neg" },
  { from: "Teams → Pro", delta: "+4", tone: "pos" },
  { from: "Paused billing", delta: "-3", tone: "neg" },
];

const initialCoupons = [
  { code: "LAUNCH50", discount: "50% off Pro", redemptions: "184 / 300", expiry: "31 Oct 2026" },
  { code: "STUDENTPK", discount: "20% off Pro", redemptions: "90 / 200", expiry: "10 Sep 2026" },
  { code: "REFERRAL10", discount: "10% off Teams", redemptions: "122 / 500", expiry: "17 Nov 2026" },
];

const healthMetrics = [
  { source: "Upwork API", percent: 99, tone: "forest", short: "UP" },
  { source: "Fiverr email parser", percent: 96, tone: "forest", short: "FI" },
  { source: "JazzCash SMS", percent: 94, tone: "forest", short: "JC" },
  { source: "Easypaisa SMS", percent: 81, tone: "red", short: "EP" },
  { source: "Bank SMS", percent: 92, tone: "forest", short: "BK" },
];

const supportTickets = [
  { priority: "High", name: "Areeba Waseem", description: "Upwork payout missing from August export", key: "high" },
  { priority: "Medium", name: "Nadir Ashraf", description: "Need help restoring a cancelled renewal", key: "med" },
  { priority: "Low", name: "Hina Yousaf", description: "Question about invoice formatting for 2025", key: "low" },
];

const initialFlags = {
  spendAlerts: true,
  whatsappBot: true,
  multiCurrency: false,
  accountantPortal: true,
  bankPdf: true,
  taxSuggestions: false,
};

const initialAudit = [
  { actor: "Anna", time: "08:14 PM", detail: "Disabled a stale coupon for a test cohort" },
  { actor: "System", time: "08:02 PM", detail: "Imported 63 new subscriber records from Stripe" },
  { actor: "Rashid", time: "07:46 PM", detail: "Approved an emergency refund request for 2 users" },
  { actor: "Anna", time: "07:12 PM", detail: "Updated the broadcast audience filters for renewing users" },
];

function DonutChart({ segments }: { segments: Array<{ label: string; share: number; users: string; color: string }> }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width="170" height="170" viewBox="0 0 170 170" aria-label="Plan distribution chart">
        <circle cx="85" cy="85" r={radius} fill="none" stroke="rgba(20,68,47,0.08)" strokeWidth="22" />
        {segments.map((segment) => {
          const dash = (segment.share / 100) * circumference;
          const circle = (
            <circle
              key={segment.label}
              cx="85"
              cy="85"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="22"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 85 85)"
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="donut-legend">
        {segments.map((segment) => (
          <div key={segment.label}>
            <i style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <b>{segment.users}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"All" | "KHATA" | "PRO" | "TEAMS">("All");
  const [broadcastAudience, setBroadcastAudience] = useState("All users");
  const [announcement, setAnnouncement] = useState("");
  const [coupons, setCoupons] = useState(initialCoupons);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount: "", expiry: "2026-09-30" });
  const [flags, setFlags] = useState(initialFlags);
  const [auditLogs, setAuditLogs] = useState(initialAudit);
  const [supportRows, setSupportRows] = useState(supportTickets);
  const toast = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("munshi_staff_auth");
    if (stored === "true") {
      setUnlocked(true);
    }

    const loadStaffData = async () => {
      const [nextFlags, nextCoupons, nextAuditLogs, nextSupportTickets] = await Promise.all([
        import("./actions").then((mod) => mod.fetchFeatureFlags()),
        import("./actions").then((mod) => mod.fetchCoupons()),
        import("./actions").then((mod) => mod.fetchAuditLogs()),
        import("./actions").then((mod) => mod.fetchSupportTickets()),
      ]);

      setFlags((current) => ({ ...current, ...nextFlags }));
      setCoupons(nextCoupons.length ? nextCoupons : initialCoupons);
      setAuditLogs(nextAuditLogs.length ? nextAuditLogs : initialAudit);
      setSupportRows(nextSupportTickets.length ? nextSupportTickets : supportTickets);
    };

    loadStaffData();
  }, []);

  const filteredSubscribers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subscriberRows.filter((row) => {
      const planMatches = planFilter === "All" || row.plan === planFilter;
      const searchMatches = !term || row.name.toLowerCase().includes(term) || row.email.toLowerCase().includes(term);
      return planMatches && searchMatches;
    });
  }, [planFilter, search]);

  const handleUnlock = async () => {
    const trimmed = passcode.trim();
    if (!trimmed) {
      toast("Access code required.");
      return;
    }

    setUnlocked(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("munshi_staff_auth", "true");
      window.sessionStorage.setItem("munshi-staff-console", "true");
    }
    toast("Console unlocked.");
  };

  const unlockConsole = handleUnlock;

  const lockConsole = () => {
    setShowLockConfirm(true);
  };

  const confirmLockConsole = () => {
    setUnlocked(false);
    setPasscode("");
    setShowPasscode(false);
    setShowLockConfirm(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("munshi_staff_auth");
      window.sessionStorage.removeItem("munshi-staff-console");
    }
  };

  const handleCreateCoupon = async () => {
    const code = newCoupon.code.trim();
    if (!code || !newCoupon.discount.trim()) {
      toast("Code and discount are required.");
      return;
    }

    const result = await import("./actions").then((mod) => mod.createCouponAction({ code, discount: newCoupon.discount, expiresAt: newCoupon.expiry }));
    if (result.ok) {
      const createdCode = result.code ?? code.toUpperCase();
      const createdDiscount = result.discount ?? newCoupon.discount;
      setCoupons((current) => [{ code: createdCode, discount: createdDiscount, redemptions: "0 / 250", expiry: newCoupon.expiry }, ...current]);
      setNewCoupon({ code: "", discount: "", expiry: "2026-09-30" });
      toast(result.message || "Coupon created");
      return;
    }

    toast(result.message || "Code and discount are required.");
  };

  const renderTabContent = () => {
    if (activeTab === "overview") {
      const linePoints = growthSeries
        .map((point, index) => {
          const x = 24 + index * 105;
          const y = 140 - point.value;
          return `${x},${y}`;
        })
        .join(" ");
      const areaPoints = `${linePoints} 560,140 24,140`;

      return (
        <div className="view active">
          <div className="kpi-row">
            {overviewKpis.map((kpi) => (
              <div key={kpi.label} className={`kpi c-${kpi.tone}`}>
                <div className="lbl">{kpi.label}</div>
                <div className="val">{kpi.value}</div>
                <div className={`delta ${kpi.tone === "red" ? "down" : ""}`}>{kpi.delta}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <section className="panel chart-panel">
              <div className="panel-head">
                <h3>Signup growth</h3>
                <span className="sub">Last 6 months</span>
              </div>
              <svg className="linechart" viewBox="0 0 620 170" preserveAspectRatio="none" role="img" aria-label="Signup growth chart">
                <defs>
                  <linearGradient id="growthGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(20,68,47,0.28)" />
                    <stop offset="100%" stopColor="rgba(20,68,47,0.02)" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => (
                  <line key={line} className="grid-line" x1="24" x2="590" y1={30 + line * 32} y2={30 + line * 32} />
                ))}
                <polygon className="area" points={areaPoints} />
                <polyline className="line" points={linePoints} />
                {growthSeries.map((point, index) => {
                  const x = 24 + index * 105;
                  const y = 140 - point.value;
                  return (
                    <g key={point.month}>
                      <circle className="dot" cx={x} cy={y} r="4" />
                      <text x={x} y="160" textAnchor="middle">{point.month}</text>
                    </g>
                  );
                })}
              </svg>
            </section>

            <section className="panel chart-panel">
              <div className="panel-head">
                <h3>Plan distribution</h3>
                <span className="sub">Live mix</span>
              </div>
              <DonutChart segments={planDistribution} />
            </section>
          </div>

          <section className="panel reminder-panel">
            <div className="panel-head">
              <h3>Plans expiring in the next 7 days</h3>
              <span className="sub">{expiringPlans.length} reminders queued</span>
            </div>
            <div className="reminder-list">
              {expiringPlans.map((row) => (
                <div className="exp-row" key={row.name}>
                  <div className="avatar-sm">{row.avatar}</div>
                  <div className="exp-info">
                    <div className="n">{row.name}</div>
                    <div className="s">{row.plan} • {row.expiry}</div>
                  </div>
                  <button
                    className="btn small ghost"
                    type="button"
                    onClick={() => {
                      toast(`Reminder sent to ${row.name} (demo).`);
                    }}
                  >
                    Send reminder
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (activeTab === "subscribers") {
      return (
        <div className="view active">
          <section className="panel">
            <div className="toolbar">
              <div className="search-box">
                <span>⌕</span>
                <input
                  aria-label="Search subscribers"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email..."
                />
              </div>
              <div className="chip-group">
                {(["All", "KHATA", "PRO", "TEAMS"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`chip-filter ${planFilter === filter ? "active" : ""}`}
                    onClick={() => setPlanFilter(filter)}
                  >
                    {filter === "All" ? "All plans" : filter === "KHATA" ? "Khata (Free)" : filter === "PRO" ? "Munshi Pro" : "Munshi Teams"}
                  </button>
                ))}
              </div>
              <button type="button" className="btn" onClick={() => toast("Subscribers list exported as CSV (demo).")}>Export CSV</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Renewal</th>
                  <th>Txns/mo</th>
                  <th className="amt-cell">MRR</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((row) => (
                  <tr key={row.id} className="row-clickable">
                    <td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="avatar-sm">{row.initials}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{row.name}</div>
                          <div className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`plan-tag ${row.plan.toLowerCase()}`}>{row.plan}</span></td>
                    <td><span className={`status-pill ${row.status.toLowerCase()}`}>{row.status}</span></td>
                    <td>{row.renewal}</td>
                    <td>{row.txn}</td>
                    <td className="amt-cell">{row.mrr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      );
    }

    if (activeTab === "plans") {
      return (
        <div className="view active">
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              { name: "Khata (Free)", price: "Free", users: "3,476", revenue: "$0", volume: "1.2k / mo" },
              { name: "Munshi Pro", price: "$10/mo", users: "612", revenue: "$6,120", volume: "4.8k / mo" },
              { name: "Munshi Teams", price: "$30/mo", users: "130", revenue: "$3,900", volume: "11.4k / mo" },
            ].map((plan, index) => (
              <div key={plan.name} className={`plan-rev-card ${index === 0 ? "free" : index === 1 ? "pro" : "teams"}`}>
                <div className="name">{plan.name}</div>
                <div className="price">{plan.price}</div>
                <div className="plan-rev-stat"><span>Active users</span><b>{plan.users}</b></div>
                <div className="plan-rev-stat"><span>Revenue</span><b>{plan.revenue}</b></div>
                <div className="plan-rev-stat"><span>Avg txn volume</span><b>{plan.volume}</b></div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <section className="panel chart-panel">
              <div className="panel-head">
                <h3>Revenue</h3>
                <span className="sub">Last 6 months</span>
              </div>
              <svg className="linechart" viewBox="0 0 620 170" preserveAspectRatio="none" role="img" aria-label="Revenue chart">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(169,124,47,0.18)" />
                    <stop offset="100%" stopColor="rgba(169,124,47,0.02)" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => (
                  <line key={line} className="grid-line" x1="24" x2="590" y1={30 + line * 28} y2={30 + line * 28} />
                ))}
                <polyline points="24,120 125,110 225,90 335,72 440,64 560,42" fill="none" stroke="var(--forest)" strokeWidth="3" />
                <polyline points="24,130 125,118 225,104 335,90 440,82 560,68" fill="none" stroke="var(--brass)" strokeWidth="3" strokeDasharray="7 6" />
                {revenueMonths.map((point, index) => {
                  const x = 24 + index * 110;
                  const y = 140 - point.value * 10;
                  return (
                    <g key={point.month}>
                      <circle cx={x} cy={y} r="4" fill="var(--forest)" />
                      <text x={x} y="160" textAnchor="middle">{point.month}</text>
                    </g>
                  );
                })}
              </svg>
            </section>

            <section className="panel flow-panel">
              <div className="panel-head">
                <h3>Upgrade / downgrade flow</h3>
                <span className="sub">Net paid growth</span>
              </div>
              <div className="flow-table">
                {revenueFlow.map((row) => (
                  <div key={row.from} className="flow-row">
                    <span>{row.from}</span>
                    <span className={`delta-pill ${row.tone}`}>{row.delta}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (activeTab === "coupons") {
      return (
        <div className="view active">
          <div className="grid-2">
            <section className="panel coupon-panel">
              <div className="panel-head">
                <h3>Active coupons</h3>
                <span className="sub">Live offers</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Redemptions</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.code}>
                      <td><span className="coupon-badge">{coupon.code}</span></td>
                      <td>{coupon.discount}</td>
                      <td>{coupon.redemptions}</td>
                      <td>{coupon.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="panel coupon-form-panel">
              <div className="panel-head">
                <h3>New coupon</h3>
                <span className="sub">Create instantly</span>
              </div>
              <div className="form-field">
                <label>Code</label>
                <input value={newCoupon.code} onChange={(event) => setNewCoupon({ ...newCoupon, code: event.target.value })} placeholder="WELCOME20" />
              </div>
              <div className="form-field">
                <label>Discount</label>
                <input value={newCoupon.discount} onChange={(event) => setNewCoupon({ ...newCoupon, discount: event.target.value })} placeholder="20% off Pro" />
              </div>
              <div className="form-field">
                <label>Expiration</label>
                <input type="date" value={newCoupon.expiry} onChange={(event) => setNewCoupon({ ...newCoupon, expiry: event.target.value })} />
              </div>
              <button type="button" className="btn" onClick={handleCreateCoupon}>Create coupon</button>
            </section>
          </div>
        </div>
      );
    }

    if (activeTab === "broadcast") {
      return (
        <div className="view active">
          <section className="panel">
            <div className="panel-head">
              <h3>Broadcast</h3>
              <span className="sub">Audience</span>
            </div>
            <div className="form-field">
              <label>Audience</label>
              <select value={broadcastAudience} onChange={(event) => setBroadcastAudience(event.target.value)}>
                <option>All users</option>
                <option>Khata (Free) only</option>
                <option>Pro only</option>
                <option>Teams only</option>
                <option>Renewing in 7 days</option>
              </select>
            </div>
            <div className="form-field">
              <label>Message</label>
              <textarea rows={8} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Your monthly accounting snapshot is ready..." />
            </div>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                if (!announcement.trim()) {
                  toast("Message cannot be empty.");
                  return;
                }

                const result = await import("./actions").then((mod) => mod.sendBroadcastAction(broadcastAudience, announcement));
                toast(result.message || "Announcement sent to selected audience");
                if (result.ok) {
                  setAnnouncement("");
                }
              }}
            >
              Send announcement
            </button>
          </section>
        </div>
      );
    }

    if (activeTab === "health") {
      return (
        <div className="view active">
          <div className="grid-2">
            <section className="panel">
              <div className="panel-head">
                <h3>Parsing accuracy</h3>
                <span className="sub">Current source quality</span>
              </div>
              {healthMetrics.map((metric) => (
                <div key={metric.source} className="health-row">
                  <div className={`health-logo ${metric.tone === "red" ? "red" : "forest"}`}>{metric.short}</div>
                  <div className="health-info">
                    <div className="n">{metric.source}</div>
                    <div className="s">Accuracy snapshot</div>
                  </div>
                  <div className="health-bar"><div className="fill" style={{ width: `${metric.percent}%` }} /></div>
                  <div className="health-pct">{metric.percent}%</div>
                </div>
              ))}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h3>Review queue</h3>
                <span className="sub">Live operations</span>
              </div>
              <div className="kpi-row compact" style={{ marginTop: 0 }}>
                <div className="kpi c-red">
                  <div className="lbl">Pending review</div>
                  <div className="val">186</div>
                </div>
                <div className="kpi c-forest">
                  <div className="lbl">Auto-resolved</div>
                  <div className="val">1,204</div>
                  <div className="delta">today</div>
                </div>
              </div>

              <div className="status-strip">
                <div className="status-chip ok">API healthy</div>
                <div className="status-chip warn">Sync delayed</div>
                <div className="status-chip ok">Gmail import active</div>
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (activeTab === "support") {
      return (
        <div className="view active">
          <section className="panel support-panel">
            <div className="panel-head">
              <h3>Open support tickets</h3>
              <span className="sub">14 open</span>
            </div>
            <div className="support-list">
              {supportRows.map((ticket) => (
                <div key={ticket.name} className="ticket-row">
                  <span className={`tk-badge ${ticket.key}`}>{ticket.priority}</span>
                  <div className="exp-info">
                    <div className="n">{ticket.name}</div>
                    <div className="s">{ticket.description}</div>
                  </div>
                  <button className="btn small ghost" type="button" onClick={() => toast("Reply composer opens here (demo).")}>Reply</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (activeTab === "flags") {
      return (
        <div className="view active">
          <section className="panel">
            <div className="panel-head">
              <h3>Feature flags</h3>
              <span className="sub">Rollouts</span>
            </div>
            <div>
              {[
                ["AI spend-anomaly alerts", "spendAlerts"],
                ["WhatsApp Bot for reminders", "whatsappBot"],
                ["Multi-currency auto-conversion", "multiCurrency"],
                ["Accountant hand-off portal", "accountantPortal"],
                ["Bank statement PDF import", "bankPdf"],
                ["Tax-saving suggestions engine", "taxSuggestions"],
              ].map(([label, key]) => (
                <div key={label} className="flag-row">
                  <div className="flag-info">
                    <div className="n">{label}</div>
                    <div className="s">{flags[key as keyof typeof flags] ? "Enabled" : "Disabled"}</div>
                  </div>
                  <ToggleSwitch
                    checked={flags[key as keyof typeof flags]}
                    label={label}
                    onCheckedChange={async (checked) => {
                      setFlags((current) => ({ ...current, [key]: checked }));
                      const result = await import("./actions").then((mod) => mod.toggleFeatureFlagAction(key, checked));
                      toast(result.message || `${label} ${checked ? "enabled" : "disabled"}.`);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="view active">
        <section className="panel audit-panel">
          <div className="panel-head">
            <h3>Audit log</h3>
            <span className="sub">Recent staff actions</span>
          </div>
          <div className="audit-list">
            {auditLogs.map((log) => (
              <div key={`${log.actor}-${log.time}-${log.detail}`} className="log-row">
                <span className="time">{log.time}</span>
                <span className="who">{log.actor}</span>
                <span>{log.detail}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <>
      {!unlocked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "#1b382b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              backgroundColor: "#faf7ee",
              border: "1.5px solid #2b2b2b",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              padding: "40px 32px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                margin: "0 0 6px",
                fontSize: "24px",
                lineHeight: 1.2,
                fontWeight: 700,
                color: "#1b382b",
                fontFamily: "Georgia, serif",
              }}
            >
              Munshi <span style={{ color: "#c2410c" }}>•</span> Staff console
            </h1>
            <p
              style={{
                margin: "0 0 24px",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#525252",
                letterSpacing: "0.02em",
              }}
            >
              for the Munshi team only
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUnlock();
              }}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Access code"
                  autoFocus
                  style={{
                    width: "100%",
                    backgroundColor: "#f4efe0",
                    border: "1px solid #2b2b2b",
                    borderRadius: "8px",
                    padding: "12px 40px 12px 14px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    color: "#1b382b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1b382b",
                    zIndex: 10,
                  }}
                  tabIndex={-1}
                >
                  {showPasscode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: "#1b382b",
                  color: "#faf7ee",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
                }}
              >
                Enter console
              </button>
            </form>

            <div style={{ marginTop: "24px" }}>
              <a
                href="/"
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#b45309",
                  textDecoration: "none",
                }}
              >
                Wrong console? Back to munshi.pk
              </a>
            </div>
          </div>
        </div>
      )}

      {unlocked && (
        <div className={`staff-shell ${unlocked ? "ready" : "locked"}`}>
          <div className="restricted-bar">• Munshi internal — staff console • access restricted to the Munshi team •</div>

          <div className="shell">
            <aside className="sidebar">
              <div className="side-brand">
                <span className="wm">Munshi</span>
                <span className="tag">Staff</span>
              </div>
              <nav className="side-nav" aria-label="Staff navigation">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`nav-item ${activeTab === item.key ? "active" : ""}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <span className="ic">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="side-foot">
                <div className="admin-id">
                  Signed in as
                  <strong>Team - Owner</strong>
                  <span>(Full access)</span>
                </div>
                <div className="lock-row">
                  <button type="button" className="lock-link" onClick={lockConsole}>
                    Lock console
                  </button>
                </div>
              </div>
            </aside>

            <main>
              <header className="topbar">
                <h1>● Live data • updated just now</h1>
                <div className="top-right">
                  <div className="live-pill"><i /> Live</div>
                  <button type="button" className="btn ghost small" onClick={() => toast("Exporting CSV (demo)...")}>
                    Export CSV
                  </button>
                </div>
              </header>

              <div className="page">{renderTabContent()}</div>
            </main>
          </div>
        </div>
      )}

      {showLockConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(13, 46, 31, 0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "#faf7ee",
              border: "1px solid #2b2b2b",
              borderRadius: "14px",
              boxShadow: "0 22px 45px rgba(0,0,0,0.28)",
              padding: "24px 22px 18px",
            }}
          >
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "22px",
                fontWeight: 700,
                color: "#1b382b",
                fontFamily: "Georgia, serif",
              }}
            >
              Lock staff console?
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "#2a2a2a",
                fontFamily: "sans-serif",
              }}
            >
              Are you sure you want to end your session and lock access?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowLockConfirm(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #2b2b2b",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  color: "#1b382b",
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLockConsole}
                style={{
                  backgroundColor: "#1b382b",
                  border: "1px solid #1b382b",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  color: "#faf7ee",
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                Confirm &amp; Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
