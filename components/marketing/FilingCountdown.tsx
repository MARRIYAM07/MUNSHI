"use client";

import { useEffect, useState } from "react";

function nextDeadline() {
  const now = new Date();
  let d = new Date(Date.UTC(now.getUTCFullYear(), 8, 30, 23, 59, 59));
  if (now > d) d = new Date(Date.UTC(now.getUTCFullYear() + 1, 8, 30, 23, 59, 59));
  return d;
}

function compute() {
  const diff = Math.max(0, nextDeadline().getTime() - Date.now());
  return {
    days: String(Math.floor(diff / 86400000)),
    hours: String(Math.floor(diff / 3600000) % 24).padStart(2, "0"),
    mins: String(Math.floor(diff / 60000) % 60).padStart(2, "0"),
  };
}

const PLACEHOLDER = { days: "--", hours: "--", mins: "--" };

export function FilingCountdown() {
  const [value, setValue] = useState(PLACEHOLDER);

  useEffect(() => {
    setValue(compute());
    const id = setInterval(() => setValue(compute()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="countdown-digits">
      <div className="cd-unit">
        <div className="cd-num">{value.days}</div>
        <div className="cd-sub">Days</div>
      </div>
      <div className="cd-unit">
        <div className="cd-num">{value.hours}</div>
        <div className="cd-sub">Hours</div>
      </div>
      <div className="cd-unit">
        <div className="cd-num">{value.mins}</div>
        <div className="cd-sub">Mins</div>
      </div>
    </div>
  );
}