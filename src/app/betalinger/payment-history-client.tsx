'use client';

import { Payment } from '@/types';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface PaymentWithRelations extends Payment {
  stable: {
    name: string;
  };
}

interface PaymentHistoryClientProps {
  payments: PaymentWithRelations[];
}

export default function PaymentHistoryClient({ payments }: PaymentHistoryClientProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'PROCESSING':
        return <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Betalt';
      case 'FAILED':
        return 'Mislykket';
      case 'CANCELLED':
        return 'Avbrutt';
      case 'PROCESSING':
        return 'Behandles';
      case 'REFUNDED':
        return 'Refundert';
      default:
        return 'Venter';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50';
      case 'REFUNDED':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
    }).format(amount / 100); // Convert from øre to NOK
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-slate-500">Du har ingen tidligere betalinger.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div key={payment.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(payment.status || 'UNKNOWN')}
                <h3 className="text-lg font-semibold text-slate-900">
                  Annonsering - {payment.stable.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status || 'UNKNOWN')}`}>
                  {getStatusText(payment.status || 'UNKNOWN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Beløp</p>
                  <p className="font-medium text-slate-900">{formatAmount(payment.total_amount)}</p>
                  {(payment.discount || 0) > 0 && (
                    <p className="text-xs text-green-600">
                      {Math.round((payment.discount || 0) * 100)}% rabatt inkludert
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-slate-500">Periode</p>
                  <p className="font-medium text-slate-900">
                    {payment.months} måned{payment.months > 1 ? 'er' : ''}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Dato</p>
                  <p className="font-medium text-slate-900">
                    {payment.created_at ? format(new Date(payment.created_at), 'dd. MMMM yyyy', { locale: nb }) : 'Ukjent dato'}
                  </p>
                  {payment.paid_at && (
                    <p className="text-xs text-slate-500">
                      Betalt: {format(new Date(payment.paid_at), 'HH:mm', { locale: nb })}
                    </p>
                  )}
                </div>
              </div>

              {payment.failure_reason && (
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Årsak:</span> {payment.failure_reason}
                  </p>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Referanse</p>
              <p className="text-xs font-mono text-slate-600">{payment.vipps_order_id}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}