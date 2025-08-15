'use client';

import { formatPrice, formatPriceRange } from '@/utils/formatting';
import { StableWithBoxStats, Box } from '@/types/stable';
import { useStableOwnerPayments } from '@/hooks/useStableOwner';

interface StableStatsCardProps {
  stable: StableWithBoxStats;
  boxes: Box[];
}

export default function StableStatsCard({ stable, boxes }: StableStatsCardProps) {
  // Get real-time payment data
  const paymentsQuery = useStableOwnerPayments(stable.id);
  
  // Filter payments for this stable
  const payments = paymentsQuery.data || [];
  const stablePayments = payments.filter((payment: { stableId: string; id: string; total_amount: number; status: string; createdAt: string }) => payment.stableId === stable.id);
  const recentPayments = stablePayments.slice(0, 3); // Show last 3 payments

  const availableBoxes = boxes.reduce((total, box) => total + (('availableQuantity' in box ? (box.availableQuantity as number) : 0) || 0), 0);
  const sponsoredBoxes = boxes.filter(box => box.isSponsored).length;
  const totalBoxes = boxes.length;
  const priceRange = boxes.length > 0 ? {
    min: Math.min(...boxes.map(b => b.price)),
    max: Math.max(...boxes.map(b => b.price))
  } : null;

  return (
    <div className="px-4 py-6 sm:px-6 bg-slate-50 border-b border-slate-100">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{totalBoxes}</div>
          <div className="text-sm text-slate-500">Totalt bokser</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{availableBoxes}</div>
          <div className="text-sm text-slate-500">Ledige</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{sponsoredBoxes}</div>
          <div className="text-sm text-slate-500">Boost aktiv</div>
        </div>
        <div className="text-left sm:text-center">
          <div className="sm:hidden text-xs text-slate-500 mb-1">Prisklasse (kr)</div>
          <div className="text-sm sm:text-2xl font-bold text-indigo-600 whitespace-nowrap">
            {priceRange ? formatPriceRange(priceRange.min, priceRange.max) : '0'}
          </div>
          <div className="hidden sm:block text-sm text-slate-500">Prisklasse (kr)</div>
        </div>
      </div>


      {/* Recent Payment Activity */}
      {recentPayments.length > 0 && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
          <h5 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            Siste betalinger
          </h5>
          <div className="space-y-2">
            {recentPayments.map((payment: { id: string; createdAt: string; total_amount: number; status: string }) => (
              <div key={payment.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {new Date(payment.createdAt || '').toLocaleDateString('nb-NO')}
                </span>
                <span className={`font-medium ${
                  payment.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {formatPrice(payment.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}