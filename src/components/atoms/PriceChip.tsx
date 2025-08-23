"use client";

import React from "react";

interface PriceChipProps {
  amount: number;
  topLabel?: string;
  bottomLabel?: string;
  showCurrency?: boolean;
  currencySuffix?: string; // e.g. " kr"
  className?: string;
}

export default function PriceChip({ amount, topLabel, bottomLabel, showCurrency = true, currencySuffix = " kr", className = "" }: PriceChipProps) {
  const formatted = new Intl.NumberFormat("nb-NO").format(amount);
  return (
    <div className={`text-right rounded-xl border border-gray-200 bg-gray-50 p-4 ${className}`}>
      {topLabel && (
        <div className="text-xs text-gray-600 font-medium">{topLabel}</div>
      )}
      <div className="text-2xl font-bold text-primary">{formatted}{showCurrency ? currencySuffix : ''}</div>
      {bottomLabel && (
        <div className="text-xs text-gray-600">{bottomLabel}</div>
      )}
    </div>
  );
}
