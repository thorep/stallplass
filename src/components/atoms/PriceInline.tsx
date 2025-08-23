"use client";

import React from "react";

interface PriceInlineProps {
  value?: number | null;
  range?: { min?: number | null; max?: number | null };
  mode?: "request";
  cadence?: "perMonth" | "once"; // once => no cadence text
  className?: string;
}

export default function PriceInline({ value, range, mode, cadence, className = "" }: PriceInlineProps) {
  const fmt = (n?: number | null) => (typeof n === "number" ? new Intl.NumberFormat("nb-NO").format(n) : undefined);

  let main: string | null = null;
  if (mode === "request") {
    main = "Pris på forespørsel";
  } else if (typeof value === "number") {
    main = `${fmt(value)} kr`;
  } else if (range) {
    const min = fmt(range.min);
    const max = fmt(range.max);
    if (min && max) main = `${min}–${max} kr`;
    else if (min) main = `Fra ${min} kr`;
    else if (max) main = `Opp til ${max} kr`;
  }

  if (!main) return null;

  return (
    <div className={`text-right ${className}`}>
      <span className="font-semibold text-base md:text-lg text-gray-900">{main}</span>
      {cadence === "perMonth" && (
        <span className="ml-2 text-xs text-gray-500">pr måned</span>
      )}
    </div>
  );
}

