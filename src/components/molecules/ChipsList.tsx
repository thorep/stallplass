"use client";

import React from "react";

interface ChipsListProps {
  items: string[];
  maxVisible?: number | null;
  className?: string;
}

export default function ChipsList({ items, maxVisible = 3, className = "" }: ChipsListProps) {
  if (!items || items.length === 0) return null;
  const visible = typeof maxVisible === 'number' ? items.slice(0, maxVisible) : items;
  const remaining = items.length - visible.length;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {visible.map((label, idx) => (
        <span
          key={`${label}-${idx}`}
          className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-sm"
        >
          <span className="w-2 h-2 bg-gray-400 rounded-full" />
          {label}
        </span>
      ))}
      {remaining > 0 && typeof maxVisible === 'number' && (
        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-sm">
          +{remaining} flere
        </span>
      )}
    </div>
  );
}
