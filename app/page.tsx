"use client";

import { useEffect, useRef, useState } from "react";
import { CountTicker } from "@/components/marketing/CountTicker";
import { LedgerTable, type LedgerColumn } from "@/components/ui/LedgerTable";
import { PricingToggle } from "@/components/marketing/PricingToggle";
import { FilingCountdown } from "@/components/marketing/FilingCountdown";
import { IngestDemo } from "@/components/marketing/IngestDemo";
import { Reveal } from "@/components/marketing/Reveal";
import type { StatusValue } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/Toast";
import "./landing.css";

const categoryOptions = ["Client Income", "Platform Fees", "Utilities", "Software & Tools", "Local Sales"] as const;

type CategoryRow = {
  id: string;
  date: string;
  description: string;
  amount: string;
  credit: boolean;
  category: string;
  confidence: "high" | "med" | "low" | "learned";
  source: string;
  status: StatusValue;
};

const categoryRows: readonly CategoryRow[] = [
  { id: "payoneer-bright", date: "03 Aug", description: "Payoneer — Bright Studio LLC", amount: "PKR 184,500", credit: true, category: "Client Income", confidence: "high", source: "Payoneer", status: "ok" },
  { id: "wise-novatech", date: "05 Aug", description: "Wise — NovaTech Inc", amount: "PKR 96,200", credit: true, category: "Client Income", confidence: "high", source: "Wise", status: "ok" },
  { id: "bank-zaid", date: "07 Aug", description: "Bank — Zaid Traders", amount: "PKR 45,000", credit: true, category: "Local Sales", confidence: "med", source: "Bank", status: "ok" },
  { id: "whatsapp-ahsan", date: "09 Aug", description: "WhatsApp — Ahsan Bhai", amount: "PKR 12,000", credit: true, category: "Client Income", confidence: "low", source: "WhatsApp", status: "review" },
  { id: "payoneer-platform", date: "10 Aug", description: "Payoneer — Platform Fee", amount: "– PKR 1,840", credit: false, category: "Platform Fees", confidence: "high", source: "Payoneer", status: "ok" },
  { id: "bank-lesco", date: "12 Aug", description: "Bank — LESCO Electricity", amount: "– PKR 8,400", credit: false, category: "Utilities", confidence: "high", source: "Bank", status: "ok" },
  { id: "wise-figma", date: "14 Aug", description: "Wise — Figma Subscription", amount: "– PKR 3,200", credit: false, category: "Software & Tools", confidence: "high", source: "Wise", status: "ok" },
  { id: "whatsapp-retainer", date: "15 Aug", description: "WhatsApp — Client retainer", amount: "PKR 60,000", credit: true, category: "Client Income", confidence: "med", source: "WhatsApp", status: "ok" },
];

const faq = [
  ["Do I have to type anything in manually?", "No — that's the whole point. Forward the PDF or screenshot the moment you're paid, and Munshi reads and categorizes it. You only open the app to review the odd flagged entry."],
  ["What if it gets a category wrong?", "Correct it once from the dropdown. Munshi remembers that merchant permanently, so the same correction never has to be made twice."],
  ["How do the client payment reminders work?", "Each client entry carries the date they agreed to pay. Once that date passes, Munshi drafts a reminder message with their name, the amount owed, and how many days overdue — you just review and send it."],
  ["Is my financial data safe?", "Raw statements are never stored — only the extracted, encrypted entries. Nobody at Munshi can see your numbers without your access."],
  ["Does it help at tax time too?", "Yes — but that's a bonus, not the main job. Because everything's already categorized and reconciled all year, exporting an FBR-ready summary is one click, any time you need it."],
  ["Can I switch plans later?", "Yes, anytime — and your full ledger history moves with you. There's no lock-in and no setup fee either way."],
] as const;

const growth = [{ month: "Mar", value: 441, height: 86 }, { month: "Apr", value: 479, height: 94 }, { month: "May", value: 512, height: 100 }, { month: "Jun", value: 548, height: 107 }, { month: "Jul", value: 574, height: 113 }, { month: "Aug", value: 612, height: 120 }] as const;

function Logo({ footer = false }: { footer?: boolean }) { return <img className={footer ? "footer-logo" : "brand-logo"} src="/munshi-logo.png" alt="Munshi logo" width={footer ? 30 : 32} height={footer ? 31 : 33} />; }
function Divider() { return <div className="divider" />; }
function AnimatedNumber({ value, duration = 1200, formatter, className, prefix = "", suffix = "" }: { value: number; duration?: number; formatter?: (value: number) => string; className?: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    let start: number | null = null;

    const tick = (time: number) => {
      if (start === null) start = time;
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(value * eased);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, value, visible]);

  const display = formatter ? formatter(Math.round(current)) : `${Math.round(current)}`;
  return <span ref={ref} className={className}>{prefix}{display}{suffix}</span>;
}

function MiniStrip({ items }: { items: readonly { value: string; label: string; warn?: boolean }[] }) { return <div className="mini-strip">{items.map((item) => <div key={item.label}><div className={`num${item.warn ? " warn" : ""}`}>{item.value}</div><div className="lbl">{item.label}</div></div>)}</div>; }

function HeroLiveRegister() {
  const [firstRowText, setFirstRowText] = useState("12 Aug P");
  const [secondRowText, setSecondRowText] = useState("");
  const [thirdRowText, setThirdRowText] = useState("");
  const [leftAfterSpend, setLeftAfterSpend] = useState(-7846);
  const [clientsStillOwing, setClientsStillOwing] = useState(0);
  const [daysToFiling, setDaysToFiling] = useState(-1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const typeText = (fullText: string, setter: (value: string) => void, onComplete?: () => void) => {
      let index = 0;
      const interval = setInterval(() => {
        index += 1;
        setter(fullText.slice(0, index));
        if (index >= fullText.length) {
          clearInterval(interval);
          onComplete?.();
        }
      }, 28);
      return interval;
    };

    timers.push(setTimeout(() => {
      const firstRow = "12 Aug Payoneer — Bright Studio LLC | PKR 184,500";
      const firstInterval = typeText(firstRow, setFirstRowText, () => {
        setLeftAfterSpend(381002);
        setClientsStillOwing(2);
        setDaysToFiling(42);
        timers.push(setTimeout(() => {
          const secondRow = "13 Aug Wise — NovaTech Inc | PKR 96,200";
          const secondInterval = typeText(secondRow, setSecondRowText, () => {
            setLeftAfterSpend(384260);
            timers.push(setTimeout(() => {
              const thirdRow = "14 Aug Bank — LESCO Electricity | – PKR 8,400";
              typeText(thirdRow, setThirdRowText);
            }, 260));
          });
          timers.push(setTimeout(() => {
            clearInterval(secondInterval);
          }, secondRow.length * 28 + 30));
        }, 420));
      });
      timers.push(setTimeout(() => {
        clearInterval(firstInterval);
      }, firstRow.length * 28 + 30));
    }, 600));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return <div className="ledger-card"><div className="ledger-head"><span><span className="live-dot"/>Live Register</span><span>Aug 2026</span></div><div className="ledger-body">
    <div className="ledger-row"><span>12 Aug</span><span>{firstRowText}</span><span className="amt credit">PKR 184,500</span></div>
    {secondRowText ? <div className="ledger-row"><span>13 Aug</span><span>{secondRowText}</span><span className="amt credit">PKR 96,200</span></div> : null}
    {thirdRowText ? <div className="ledger-row"><span>14 Aug</span><span>{thirdRowText}</span><span className="amt debit">– PKR 8,400</span></div> : null}
    <div className="ledger-row current"><span>15 Aug</span><span>WhatsApp — Client retainer</span><span className="amt credit">PKR 60,000</span></div>
  </div><div className="ledger-stats"><div className="lstat"><div className="num">{leftAfterSpend.toLocaleString("en-US")}</div><div className="lbl">Left after spend, PKR</div></div><div className="lstat"><div className="num">{clientsStillOwing}</div><div className="lbl">Clients still owing</div></div><div className="lstat"><div className="num">{daysToFiling}</div><div className="lbl">Days to filing</div></div></div></div>;
}

function FolioOverview() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState({ income: 397700, review: 1, owed: 2 });
  const [visibleRows, setVisibleRows] = useState([false, false, false]);

  useEffect(() => {
    if (!open) {
      setSummary({ income: 397700, review: 1, owed: 2 });
      setVisibleRows([false, false, false]);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    setSummary({ income: 370761, review: 1, owed: 31697 });

    timers.push(setTimeout(() => setSummary({ income: 382250, review: 1, owed: 32784 }), 120));
    timers.push(setTimeout(() => setSummary({ income: 397700, review: 1, owed: 34000 }), 420));
    timers.push(setTimeout(() => setVisibleRows([true, false, false]), 520));
    timers.push(setTimeout(() => setVisibleRows([true, true, false]), 900));
    timers.push(setTimeout(() => setVisibleRows([true, true, true]), 1300));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [open]);

  return <div className={`folio-card${open ? " is-open" : ""}`}>
    <div className="folio-summary" role="button" tabIndex={0} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }}>
      <div className="folio-label">Folio 01 — Overview</div>
      <h3>The Sunday-night page.</h3>
      <p className="fc-desc">One page, checked once a week — income so far, what&apos;s still uncategorized, and who still owes you.</p>
      <MiniStrip items={[{ value: "397,700", label: "Income, Aug" }, { value: "1", label: "Needs review", warn: true }, { value: "2", label: "Clients owing" }]} />
      <span className="open-toggle"><span className="arrow">▾</span>{open ? "Close this screen" : "Open this screen"}</span>
    </div>
    <div className={`folio-expand-inner${open ? " open" : ""}`}>
      <MiniStrip items={[{ value: summary.income.toLocaleString("en-US"), label: "Income, PKR" }, { value: String(summary.review), label: "Needs review", warn: true }, { value: summary.owed.toLocaleString("en-US"), label: "Owed by clients" }]} />
      <div className="folio-ledger">
        <div className={`ledger-row folio-row ${visibleRows[0] ? "is-visible" : ""}`}><span>15 Aug</span><span>WhatsApp — Client retainer</span><span className="amt credit">PKR 60,000</span></div>
        <div className={`ledger-row folio-row ${visibleRows[1] ? "is-visible" : ""}`}><span>14 Aug</span><span>Wise — Figma Subscription</span><span className="amt debit">– PKR 3,200</span></div>
        <div className={`ledger-row folio-row ${visibleRows[2] ? "is-visible" : ""}`}><span>12 Aug</span><span>Bank — LESCO Electricity</span><span className="amt debit">– PKR 8,400</span></div>
      </div>
    </div>
  </div>;
}

function Folio({ number, title, description, preview, children }: { number: string; title: string; description: string; preview: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return <Reveal><div className={`folio-card${open ? " is-open" : ""}`}>
    <div className="folio-summary" role="button" tabIndex={0} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }}>
      <div className="folio-label">{number}</div>
      <h3>{title}</h3>
      <p className="fc-desc">{description}</p>
      {preview}
      <span className="open-toggle"><span className="arrow">▾</span>{open ? "Close this screen" : "Open this screen"}</span>
    </div>
    <div className={`folio-expand-inner${open ? " open" : ""}`}>
      {children}
    </div>
  </div></Reveal>;
}

function CategoryDemo() {
  const [rows, setRows] = useState(categoryRows);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [summary, setSummary] = useState({ income: 397700, categorized: 385700, review: 12000 });
  const showToast = useToast();

  const handleCategorySelect = (rowId: string, nextCategory: string) => {
    setRows((currentRows) => {
      const nextRows: CategoryRow[] = currentRows.map((row) => row.id === rowId ? { ...row, category: nextCategory, confidence: "learned", status: "learned" } : row);
      const reviewCount = nextRows.filter((row) => row.status === "review").length;
      setSummary({ income: 397700, categorized: 397700, review: reviewCount === 0 ? 0 : 12000 });
      return nextRows;
    });
    setOpenRowId(null);
    showToast(`Categorized as ${nextCategory} — Munshi will remember this.`);
  };

  const categoryColumns: readonly LedgerColumn<CategoryRow>[] = [
    { id: "date", header: "Date", render: (row) => row.date },
    { id: "description", header: "Description", render: (row) => row.description },
    { id: "amount", header: "Amount", headerClassName: "amount-head", className: (row) => `amt-cell ${row.credit ? "credit" : "debit"}`, render: (row) => row.amount },
    { id: "category", header: "Category", render: (row) => (
      <div style={{ position: "relative" }}>
        <button type="button" className="cat-pill" aria-expanded={openRowId === row.id} onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpenRowId((current) => current === row.id ? null : row.id);
        }}>
          <span className={`conf-dot ${row.confidence}`} aria-hidden="true" />
          {row.category}
        </button>
        {openRowId === row.id ? (
          <div className="cat-dropdown open">
            {categoryOptions.map((category) => (
              <button key={category} type="button" onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleCategorySelect(row.id, category);
              }}>
                {category}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    ) },
    { id: "source", header: "Source", className: "src-tag", render: (row) => row.source },
    { id: "status", header: "Status", status: (row) => row.status },
  ];

  return (
    <div className="cat-card">
      <div className="cat-summary">
        <div>
          <AnimatedNumber value={summary.income} formatter={(value) => new Intl.NumberFormat("en-US").format(value)} className="num" />
          <div className="lbl">Income, PKR</div>
        </div>
        <div>
          <AnimatedNumber value={summary.categorized} formatter={(value) => new Intl.NumberFormat("en-US").format(value)} className="num" />
          <div className="lbl">Categorized, PKR</div>
        </div>
        <div>
          <AnimatedNumber value={summary.review} formatter={(value) => new Intl.NumberFormat("en-US").format(value)} className="num warn" />
          <div className="lbl">Needs review, PKR</div>
        </div>
      </div>
      <LedgerTable rows={rows} columns={categoryColumns} getRowKey={(row) => `${row.date}-${row.description}`} getRowStatus={(row) => row.status} />
    </div>
  );
}

function ExportButtonDemo() {
  const [isPreparing, setIsPreparing] = useState(false);
  const showToast = useToast();

  const handleExport = () => {
    if (isPreparing) return;
    setIsPreparing(true);
    window.setTimeout(() => {
      setIsPreparing(false);
      showToast("FBR summary exported.");
    }, 900);
  };

  return <button className="export-btn" type="button" onClick={handleExport}><span className={`export-state ${isPreparing ? "is-loading" : ""}`} />{isPreparing ? "Preparing summary..." : "Export FBR summary"}</button>;
}

type ApprovalItem = {
  id: string;
  tag: string;
  source: string;
  title: string;
  amount: string;
  due: string;
  approve: string;
  status: "pending" | "processing" | "approved" | "declined";
};

const initialApprovals: readonly ApprovalItem[] = [
  { id: "approval-bill", tag: "Bill detected", source: "LESCO — via forwarded bill", title: "LESCO Electricity Bill", amount: "PKR 8,400", due: "Due 28 Aug 2026", approve: "Approve & Pay", status: "pending" },
  { id: "approval-payout", tag: "Client payout due", source: "Refund — Bright Studio LLC", title: "Client Payout Refund", amount: "PKR 15,000", due: "Account on file: •••• 4471", approve: "Approve & Send", status: "pending" },
];

function ApprovalDemo({ onCountChange }: { onCountChange?: (value: number) => void }) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const showToast = useToast();

  const handleDecision = (id: string, decision: "approve" | "decline") => {
    const target = approvals.find((approval) => approval.id === id);
    if (!target || target.status !== "pending") return;

    const nextStatus = decision === "approve" ? "approved" : "declined";
    setApprovals((currentApprovals) => currentApprovals.map((approval) => approval.id === id ? { ...approval, status: nextStatus } : approval));

    if (decision === "approve") {
      showToast(id === "approval-bill" ? "Approved — LESCO bill paid via demo rail." : "Approved — client refund queued.");
      return;
    }

    showToast(id === "approval-bill" ? "Declined — LESCO bill was not sent." : "Declined — client payout was not sent.");
  };

  const pendingCount = approvals.filter((approval) => approval.status === "pending").length;

  useEffect(() => {
    onCountChange?.(pendingCount);
  }, [onCountChange, pendingCount]);

  return (
    <>
      {approvals.map((approval) => {
        const isApproved = approval.status === "approved";
        const isDeclined = approval.status === "declined";
        const resolved = isApproved || isDeclined;

        return (
          <div key={approval.id} className={`approval-card${resolved ? " resolved" : ""}`}>
            <div className="approval-head">
              <span className="approval-tag">{approval.tag}</span>
              <span className="approval-src mono">{approval.source}</span>
            </div>
            <div className="approval-title">{approval.title}</div>
            <div className="approval-amt mono">{approval.amount}</div>
            <div className="approval-due mono">{approval.due}</div>

            {resolved ? (
              <div className="approval-status show" style={{ marginTop: 12, color: isApproved ? "var(--forest)" : "var(--red)" }}>
                {isApproved ? "Approved" : "Declined"}
              </div>
            ) : (
              <div className="approval-actions">
                <button className="btn-decline" type="button" onClick={() => handleDecision(approval.id, "decline")}>Decline</button>
                <button className="btn-approve" type="button" onClick={() => handleDecision(approval.id, "approve")}>{approval.approve}</button>
              </div>
            )}
          </div>
        );
      })}
      <div className="approval-total">{pendingCount} awaiting approval</div>
    </>
  );
}

function ApprovalFolio() {
  const [pendingCount, setPendingCount] = useState(2);

  return <Folio number="Folio 05 — Approvals & payouts" title="Nothing moves without your yes." description="A bill comes in, or a client is owed a refund — Munshi asks first. You approve, then it pays, through a licensed payment rail (Raast / JazzCash / Easypaisa)." preview={<MiniStrip items={[{ value: `${pendingCount}`, label: "Awaiting approval", warn: pendingCount > 0 }]} />}><ApprovalDemo onCountChange={setPendingCount} /><div className="approval-note">This is a working demo of the flow only — real transfers need Munshi to be connected through a licensed payment partner first. Nothing here moves real money yet.</div></Folio>;
}

function GrowthChart() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className="growth-chart-card"><div className="gc-head">Businesses on Munshi — last 6 months</div><div className="gc-bars">{growth.map((d, index) => <div className={`gc-col${visible ? " is-visible" : ""}${index === growth.length - 1 ? " is-current" : ""}`} key={d.month}><div className="bar-val"><AnimatedNumber value={d.value} duration={1100} formatter={(val) => new Intl.NumberFormat("en-US").format(val)} /></div><div className={`bar${visible ? " is-visible" : ""}`} style={{ height: visible ? `${d.height}%` : "0%", transitionDelay: `${index * 110}ms` }} /><div className="bar-lbl">{d.month}</div></div>)}</div></div>;
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return <div className="faq-list">{faq.map((item, index) => {
    const isOpen = openIndex === index;
    return <div className={`faq-item${isOpen ? " is-open" : ""}`} key={item[0]}>
      <button type="button" className="faq-q" onClick={() => setOpenIndex((current) => current === index ? null : index)}>
        <span>{item[0]}</span>
        <span className="plus">{isOpen ? "−" : "+"}</span>
      </button>
      <div className="faq-a"><p>{item[1]}</p></div>
    </div>;
  })}</div>;
}

export default function LandingPage() {
  return <div className="landing">
    <div className="announce">The only Pakistani freelance ledger that <strong>totals your income, tracks what clients still owe — and reminds them for you</strong>.</div>
    <nav className="marketing-nav"><div className="nav-inner"><a className="wordmark" href="/"><Logo />MUNSHI<span className="dot">.</span></a><div className="tabs"><a href="#register">Register</a><a href="#how">How it works</a><a href="#security">Security</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="/privacy">Privacy</a></div><a className="nav-cta" href="/login">Open your ledger</a></div></nav>
    <header className="hero"><div className="wrap hero-grid"><div className="hero-copy"><div className="eyebrow">Folio No. 001 — Income, Dues &amp; Bookkeeping, Pakistan</div><h1>Always know what you made,<br />what&apos;s left, <em>and who still owes you</em>.</h1><div className="unique-tag">✓ Forward it — that&apos;s the whole step. No new app, no manual entry, ever.</div><p className="hero-sub">Munshi reads your Payoneer statements and WhatsApp payments, keeps a running ledger, and tracks what every client still owes — filing-ready summaries come for free, whenever you need them.</p><div className="hero-ctas"><a className="btn-primary" href="#pricing">Open your ledger →</a><a className="btn-ghost" href="#register">See the register</a></div></div>
      <HeroLiveRegister />
    </div></header>
    <Divider />
    <section id="register"><div className="wrap"><div className="section-head"><div className="eyebrow">The Register</div><h2>Four screens a freelancer actually opens.</h2><p>Tap any folio to open it up — the same screens from the real product, not a marketing simplification of them.</p></div><div className="folio-grid">
      <FolioOverview />
      <Folio number="Folio 02 — Statement ingestion" title="It reads what you already send." description="Drop a Payoneer PDF or a WhatsApp payment screenshot. Munshi does the rest — no manual entry." preview={<div className="mini-drop">Drop a statement or screenshot →</div>}><IngestDemo /></Folio>
      <Folio number="Folio 03 — Categorization" title="It categorizes, and it learns." description="Correct a category once — Munshi remembers that merchant for good, so you stop re-teaching it every month." preview={<MiniStrip items={[{ value: "7", label: "Categorized" }, { value: "1", label: "Needs review", warn: true }]} />}><CategoryDemo /></Folio>
      <Folio number="Folio 04 — Reports & export" title="It closes the books, on demand." description="Category totals that reconcile on their own, formatted the way FBR expects — export it and hand it off." preview={<MiniStrip items={[{ value: "384,260", label: "Net, Aug" }]} />}><div className="report-card">{[["Client income", "PKR 397,700"], ["Platform fees", "– PKR 1,840"], ["Utilities", "– PKR 8,400"], ["Software & tools", "– PKR 3,200"]].map((row) => <div className="report-row" key={row[0]}><span>{row[0]}</span><span>{row[1]}</span></div>)}<div className="report-row total"><span>Net income</span><span>PKR 384,260</span></div><ExportButtonDemo /></div></Folio>
      <ApprovalFolio />
    </div></div></section>
    <Divider />
    <section id="how"><div className="wrap"><div className="section-head"><div className="eyebrow">Voucher Sequence</div><h2>Four vouchers to your first closed month.</h2></div><div className="vouchers">{[["01", "Connect", "Forward a statement or screenshot the moment a payment lands — no separate app to open."], ["02", "Read", "Munshi extracts and categorizes each entry in seconds, and flags anything it isn't sure about."], ["03", "Reconcile", "Categories add up on their own, and every client's balance stays current — export it whenever you actually need it."], ["04", "Follow up", "See which clients are past their due date, and send the drafted reminder — no chasing from memory."]].map((v) => <Reveal key={v[0]}><article className="voucher"><div className="vno">{v[0]}</div><h4>{v[1]}</h4><p>{v[2]}</p></article></Reveal>)}</div></div></section>
    <Divider />
    <section className="yearend"><div className="wrap yearend-grid"><div><div className="eyebrow">One More Thing It Does</div><h2>And when September comes, you&apos;re already done.</h2><p>No scramble at year end. Every entry you forwarded all year is already categorized and reconciled, so filing is one export, not a week of digging through statements.</p><ul className="yearend-list"><li>Every Payoneer, Wise and WhatsApp payment already logged</li><li>Categories reconciled month by month, not all at once</li><li>Every client&apos;s due date tracked, reminders drafted the moment they&apos;re late</li><li>One-click FBR-ready summary, for any period you need</li></ul></div><div className="countdown-card"><div className="cd-label">Time left to file, this year</div><FilingCountdown /><div className="cd-note">Munshi users are usually export-ready weeks before this.</div><a className="cd-cta" href="#pricing">Get ahead of it →</a></div></div></section>
    <Divider />
    <section id="growth"><div className="wrap"><div className="section-head"><div className="eyebrow">Growing folio</div><h2>Real books, added every week.</h2></div><div className="growth-grid"><div className="growth-stats">{([ [612, "Businesses on Munshi"], [1840, "Clients tracked, total"], [18.4, "Logged this month"], [38, "New ledgers this month"] ] as const).map((s) => <Reveal key={s[1]}><div className="growth-stat"><div className="num"><AnimatedNumber value={Number(s[0])} duration={1300} formatter={(value) => s[1] === "Logged this month" ? `PKR ${value.toFixed(1)}M` : s[1] === "Businesses on Munshi" ? new Intl.NumberFormat("en-US").format(value) : s[1] === "Clients tracked, total" ? new Intl.NumberFormat("en-US").format(value) : `+${new Intl.NumberFormat("en-US").format(value)}`} /></div><div className="lbl">{s[1]}</div></div></Reveal>)}</div><Reveal><GrowthChart /></Reveal></div></div></section>
    <Divider />
    <section id="security"><div className="wrap"><div className="section-head"><div className="eyebrow">Your Data, Protected</div><h2>Trusted with the numbers, not just the app.</h2></div><div className="stamps-grid"><Reveal><Stamp badge="Sealed">Raw statements are never stored — only the extracted, encrypted data.</Stamp></Reveal><Reveal><Stamp badge="Private">Only you can see your numbers. Even we can&apos;t, without your access.</Stamp></Reveal><Reveal><Stamp badge="FBR Ready">Built for FBR from day one — export-ready, not retrofitted later.</Stamp></Reveal></div></div></section>
    <Divider />
    <section id="pricing"><Reveal><div className="wrap"><div className="section-head"><div className="eyebrow">Tariff</div><h2>Honest pricing, in dollars.</h2></div><PricingToggle /><div className="tariff-note">No setup fee. No lock-in. Cancel anytime — your ledger exports with you. Prices shown in USD; billed in PKR at the daily rate for Pakistani cards.</div></div></Reveal></section>
    <Divider />
    <section id="faq"><div className="faq-float-layer" aria-hidden="true"><div className="faq-float f1 c-forest"><span className="qm">?</span>Works with slow internet?</div><div className="faq-float f2 c-brass"><span className="qm">?</span>Support in Urdu?</div><div className="faq-float f3 c-forest"><span className="qm">?</span>Team access for my accountant?</div><div className="faq-float f4 c-brass"><span className="qm">?</span>Export as Excel or PDF?</div></div><div className="wrap faq-content"><div className="section-head"><div className="eyebrow">Questions</div><h2>Before you forward your first statement.</h2></div><FaqAccordion /></div></section>
    <Divider />
    <Footer />
  </div>;
}

function Approval({ tag, source, title, amount, due, approve }: { tag: string; source: string; title: string; amount: string; due: string; approve: string }) { return <div className="approval-card"><div className="approval-head"><span className="approval-tag">{tag}</span><span className="approval-src mono">{source}</span></div><div className="approval-title">{title}</div><div className="approval-amt mono">{amount}</div><div className="approval-due mono">{due}</div><div className="approval-actions"><button className="btn-decline" type="button">Decline</button><button className="btn-approve" type="button">{approve}</button></div></div>; }
function Stamp({ badge, children }: { badge: string; children: React.ReactNode }) { return <article className="stamp-card"><div className="stamp-badge settle">{badge}</div><p>{children}</p></article>; }
function Footer() { return <footer><div className="wrap"><div className="foot-cols"><div className="foot-col brand-column"><div className="foot-tag"><Logo footer />Munshi<span className="footer-dot">.</span></div><div className="foot-sub">Made in Pakistan, for Pakistani freelancers.</div><div className="trust-strip"><div className="trust-chip"><span className="dot" />256-bit encrypted</div><div className="trust-chip"><span className="dot" />Raw statements never stored</div></div></div><div className="foot-col"><div className="foot-col-label">Product</div><a href="#register">Register</a><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div><div className="foot-col"><div className="foot-col-label">Legal</div><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><span className="foot-line">Registered with SECP, Pakistan</span></div><div className="foot-col"><div className="foot-col-label">Contact</div><a href="mailto:support@munshi.app">support@munshi.app</a><a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="foot-line whatsapp">WhatsApp: +92 300 1234567</a><span className="foot-line">Lahore, Pakistan</span></div></div><div className="foot-grid"><div className="foot-disclaimer">Munshi is a bookkeeping and record-keeping tool. It is not a bank, is not licensed to hold or move funds, and never asks for your online banking password. All data comes from statements and screenshots you choose to forward.</div><div className="foot-sub mono">© 2026 Munshi. Folio closed. <a href="/staff">·&nbsp;Staff</a></div></div></div></footer>; }
