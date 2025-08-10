"use client";

import Button from "@/components/atoms/Button";
// import { BasePrice } from "@/types"; // Removed - BasePrice type no longer exists
import { CalculatorIcon, CheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

// Temporarily disabled - BasePrice type removed
// interface PricingClientProps {
//   sponsoredPrice: BasePrice | null;
//   boostDiscounts: Array<{ id: string; days: number; percentage: number; isActive: boolean }>;
// }

export default function PricingClient() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 p-6">
      <div className="text-center">
        <h1 className="text-h1 font-bold mb-4">Prissetting</h1>
        <p className="text-body text-slate-600">
          Prissetting-komponenten er midlertidig deaktivert mens vi oppdaterer prisstrukturen.
        </p>
      </div>
    </div>
  );
}