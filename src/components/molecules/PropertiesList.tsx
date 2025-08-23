"use client";

import React from "react";

interface PropertiesListProps {
  items: Array<{ label: string; value?: React.ReactNode } | null | undefined>;
  columns?: 2 | 3;
  className?: string;
}

export default function PropertiesList({ items, columns = 3, className = "" }: PropertiesListProps) {
  const visible = (items || []).filter(Boolean) as Array<{ label: string; value?: React.ReactNode }>;
  if (visible.length === 0) return null;
  const gridCols = columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div className={`grid grid-cols-2 ${gridCols} gap-4 text-sm ${className}`}>
      {visible.map((item, idx) => (
        <div key={`${item.label}-${idx}`}>
          <span className="font-medium text-gray-500">{item.label}:</span>
          <p className="text-gray-900 mt-0.5">{item.value ?? "Ikke oppgitt"}</p>
        </div>
      ))}
    </div>
  );
}

