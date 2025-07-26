'use client';

import { 
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PaymentStats } from '@/hooks/usePaymentTracking';

interface PaymentTrackingDashboardProps {
  paymentStats: PaymentStats | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function PaymentTrackingDashboard({
  paymentStats,
  isLoading,
  onRefresh
}: PaymentTrackingDashboardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Betalinger
          </h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-100 h-16 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!paymentStats) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center text-slate-500">
          <CreditCardIcon className="h-8 w-8 mx-auto mb-2" />
          <p>Ingen betalingsdata tilgjengelig</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <CreditCardIcon className="h-5 w-5 mr-2" />
          Betalinger - Live statistikk
        </h3>
        <button
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          title="Oppdater"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Payment Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-900">{paymentStats.totalPayments}</p>
            </div>
            <CreditCardIcon className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Fullført</p>
              <p className="text-2xl font-bold text-green-900">{paymentStats.successfulPayments}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Venter</p>
              <p className="text-2xl font-bold text-amber-900">{paymentStats.pendingPayments}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Feilet</p>
              <p className="text-2xl font-bold text-red-900">{paymentStats.failedPayments}</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Revenue Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-600 mb-2">Total inntekt</h4>
          <p className="text-xl font-bold text-blue-900">{formatCurrency(paymentStats.totalAmount)}</p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-indigo-600 mb-2">Gjennomsnittsbetaling</h4>
          <p className="text-xl font-bold text-indigo-900">{formatCurrency(paymentStats.averageAmount)}</p>
        </div>
      </div>
    </div>
  );
}