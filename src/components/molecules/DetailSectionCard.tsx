"use client";

import React from "react";

interface DetailSectionCardProps {
  title?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function DetailSectionCard({ title, header, children, className = "" }: DetailSectionCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 ${className}`}>
      {title ? (
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{title}</h2>
      ) : null}
      {header ? (
        <div className="mb-6">{header}</div>
      ) : null}
      {children}
    </div>
  );
}
