'use client';

import { useState } from 'react';
import { useGetBoostDiscounts, usePutBoostDiscount, useDeleteBoostDiscount } from '@/hooks/usePricing';
import { 
  PencilIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export function PricingAdmin() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-h1 font-bold mb-4">Prisadministrasjon</h1>
        <p className="text-body text-slate-600">
          Prisadministrasjon-komponenten er midlertidig deaktivert mens vi oppdaterer prisstrukturen.
        </p>
      </div>
    </div>
  );
}