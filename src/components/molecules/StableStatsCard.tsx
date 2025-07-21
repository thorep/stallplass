'use client';

import { formatPrice, formatPriceRange } from '@/utils/formatting';
import { StableWithBoxStats, Box } from '@/types/stable';
import { useStableOwnerRentals, useStableOwnerPayments } from '@/hooks/useStableOwnerRealTime';

interface StableStatsCardProps {
  stable: StableWithBoxStats;
  boxes: Box[];
}

export default function StableStatsCard({ stable, boxes }: StableStatsCardProps) {
  // Get real-time rental and payment data
  const { rentals } = useStableOwnerRentals();
  const { payments } = useStableOwnerPayments();
  
  // Filter rentals for this specific stable
  const stallUtleier = rentals.filter(rental => rental.stall_id === stable.id);
  const activeRentals = stallUtleier.filter(rental => rental.status === 'ACTIVE');
  const pendingRentals: typeof stallUtleier = []; // No pending status in current enum
  
  // Filter payments for this stable
  const stablePayments = payments.filter(payment => payment.stall_id === stable.id);
  const recentPayments = stablePayments.slice(0, 3); // Show last 3 payments

  const availableBoxes = boxes.filter(box => box.er_tilgjengelig).length;
  const sponsoredBoxes = boxes.filter(box => box.er_sponset).length;
  const totalBoxes = boxes.length;
  const priceRange = boxes.length > 0 ? {
    min: Math.min(...boxes.map(b => b.maanedlig_pris)),
    max: Math.max(...boxes.map(b => b.maanedlig_pris))
  } : null;

  return (
    <div className="p-6 bg-slate-50 border-b border-slate-100">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
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
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {priceRange ? formatPriceRange(priceRange.min, priceRange.max) : '0'}
          </div>
          <div className="text-sm text-slate-500">Prisklasse (kr)</div>
        </div>
      </div>

      {/* Real-time Rental Activity */}
      {(activeRentals.length > 0 || pendingRentals.length > 0) && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
          <h5 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live leieaktivitet
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{activeRentals.length}</div>
              <div className="text-slate-500">Aktive leieforhold</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{pendingRentals.length}</div>
              <div className="text-slate-500">Ventende forespørsler</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payment Activity */}
      {recentPayments.length > 0 && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
          <h5 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            Siste betalinger
          </h5>
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {new Date(payment.opprettet_dato || '').toLocaleDateString('nb-NO')}
                </span>
                <span className={`font-medium ${
                  payment.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {formatPrice(payment.total_belop)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}