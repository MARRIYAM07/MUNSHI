"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

const ROWS = [
  ["03 Aug — Payoneer Payout", "PKR 184,500"],
  ["05 Aug — Wise Transfer", "PKR 96,200"],
  ["07 Aug — WhatsApp — Cash", "PKR 12,000"],
  ["09 Aug — Bank — LESCO", "– PKR 8,400"],
] as const;

const STAGGER_MS = 180;
const LOOP_MS = 7000;

export function IngestDemo() {
  const [step, setStep] = useState(-1);
  const [statusText, setStatusText] = useState("Drop a statement or screenshot");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const showToast = useToast();

  const runDemo = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setStatusText("Reading statement...");
    setStep(0);

    timersRef.current.push(
      setTimeout(() => {
        ROWS.forEach((_, i) => {
          timersRef.current.push(setTimeout(() => setStep(i + 1), i * STAGGER_MS));
        });
        timersRef.current.push(
          setTimeout(() => setStep(ROWS.length + 1), ROWS.length * STAGGER_MS + 200)
        );
      }, 1000)
    );
  };

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setStatusText("Extracted entries:");
      setStep(ROWS.length + 1);
      return;
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const scanning = step === 0;
  const rowsShown = Math.max(0, Math.min(step, ROWS.length));
  const stampShown = step > ROWS.length;

  return (
    <div
      className="drop-mock"
      onClick={() => {
        runDemo();
        showToast("Statement imported — Munshi is extracting entries.");
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          runDemo();
          showToast("Statement imported — Munshi is extracting entries.");
        }
      }}
    >
      <div className="scan-area">
        <div className="doc-lines">
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className={`scan-line${scanning ? " active" : ""}`} />
      </div>
      <div className="dz-label">{statusText}</div>
      <div className="extract-list">
        {ROWS.map((row, i) => (
          <div className={`erow${i < rowsShown ? " show" : ""}`} key={row[0]}>
            <span>{row[0]}</span>
            <span>{row[1]}</span>
          </div>
        ))}
      </div>
      <div className={`stamp-note${stampShown ? " show" : ""}`}>
        4 entries extracted, Folio 02
      </div>
    </div>
  );
}