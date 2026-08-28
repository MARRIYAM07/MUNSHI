"use client";

import { useEffect, useState } from "react";

const ROWS = [
  ["03 Aug — Payoneer Payout", "PKR 184,500"],
  ["05 Aug — Wise Transfer", "PKR 96,200"],
  ["07 Aug — WhatsApp — Cash", "PKR 12,000"],
  ["09 Aug — Bank — LESCO", "– PKR 8,400"],
] as const;

const STAGGER_MS = 180;
const LOOP_MS = 7000;

export function IngestDemo() {
  // step: -1 = idle, 0 = scanning, 1..ROWS.length = rows revealed so far,
  // ROWS.length+1 = stamp shown
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setStep(ROWS.length + 1);
      return;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];

    function run() {
      setStep(0);
      timers.push(
        setTimeout(() => {
          ROWS.forEach((_, i) => {
            timers.push(
              setTimeout(() => setStep(i + 1), i * STAGGER_MS)
            );
          });
          timers.push(
            setTimeout(
              () => setStep(ROWS.length + 1),
              ROWS.length * STAGGER_MS + 200
            )
          );
        }, 1400)
      );
    }

    run();
    const loop = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = [];
      run();
    }, LOOP_MS);

    return () => {
      clearInterval(loop);
      timers.forEach(clearTimeout);
    };
  }, []);

  const scanning = step === 0;
  const rowsShown = Math.max(0, Math.min(step, ROWS.length));
  const stampShown = step > ROWS.length;

  return (
    <div className="drop-mock">
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
      <div className="dz-label">Extracted entries:</div>
      <div className="extract-list">
        {ROWS.map((row, i) => (
          <div className={`erow${i < rowsShown ? " show" : ""}`} key={row[0]}>
            <span>{row[0]}</span>
            <span>{row[1]}</span>
          </div>
        ))}
      </div>
      <div className={`stamp-note${stampShown ? " show" : ""}`}>
        4 entries extracted, folio 02
      </div>
    </div>
  );
}