'use client';

import { useState } from 'react';
import { 
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { PaymentStats, PaymentUpdate } from '@/hooks/usePaymentTracking';

interface PaymentTrackingDashboardProps {
  paymentStats: PaymentStats | null;
  recentUpdates: PaymentUpdate[];
  isLoading: boolean;
  onRefresh: () => void;
  onClearUpdates: () => void;
}

const statusConfig = {
  COMPLETED: {
    icon: CheckCircleIcon,
    label: 'Fullført',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  PENDING: {
    icon: ClockIcon,
    label: 'Venter',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  PROCESSING: {
    icon: ClockIcon,
    label: 'Behandles',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  FAILED: {
    icon: XCircleIcon,
    label: 'Feilet',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  REFUNDED: {
    icon: ArrowPathIcon,
    label: 'Refundert',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  CANCELLED: {
    icon: XCircleIcon,
    label: 'Kansellert',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

function PaymentStatusCard({ 
  status, 
  count, 
  amount, 
  label, 
  isLoading = false 
}: { 
  status: keyof typeof statusConfig;
  count: number;
  amount: number;
  label: string;
  isLoading?: boolean;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center">
        <Icon className={`h-6 w-6 ${config.color}`} />
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${config.color}`}>{label}</p>
          <div className="mt-1">
            {isLoading ? (
              <div className="space-y-1">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-600">
                  {amount.toLocaleString('nb-NO')} kr
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentTrackingDashboard({
  paymentStats,
  recentUpdates,
  isLoading,
  onRefresh,
  onClearUpdates
}: PaymentTrackingDashboardProps) {
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const displayedUpdates = showAllUpdates ? recentUpdates : recentUpdates.slice(0, 5);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('nb-NO', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Live Betalingssporing</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Oppdater</span>
        </button>
      </div>

      {/* Payment Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaymentStatusCard
          status="COMPLETED"
          count={paymentStats?.completedCount || 0}
          amount={paymentStats?.completedAmount || 0}
          label="Fullførte betalinger"
          isLoading={isLoading}
        />
        <PaymentStatusCard
          status="PENDING"
          count={paymentStats?.pendingCount || 0}
          amount={paymentStats?.pendingAmount || 0}
          label="Ventende betalinger"
          isLoading={isLoading}
        />
        <PaymentStatusCard
          status="PROCESSING"
          count={paymentStats?.processingCount || 0}
          amount={paymentStats?.processingAmount || 0}
          label="Behandles"
          isLoading={isLoading}
        />
        <PaymentStatusCard
          status="FAILED"
          count={paymentStats?.failedCount || 0}
          amount={paymentStats?.failedAmount || 0}
          label="Feilede betalinger"
          isLoading={isLoading}
        />
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Sammendrag</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <CreditCardIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {paymentStats?.totalCount || 0}
            </p>
            <p className="text-sm text-slate-600">Totale betalinger</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {(paymentStats?.totalAmount || 0).toLocaleString('nb-NO')} kr
            </p>
            <p className="text-sm text-slate-600">Total verdi</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">
              {((paymentStats?.completedCount || 0) / Math.max(paymentStats?.totalCount || 1, 1) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-slate-600">Suksessrate</p>
          </div>
        </div>
      </div>

      {/* Real-time Updates */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900">
              Live oppdateringer ({recentUpdates.length})
            </h3>
            <div className="flex items-center space-x-2">
              {recentUpdates.length > 5 && (
                <button
                  onClick={() => setShowAllUpdates(!showAllUpdates)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showAllUpdates ? 'Vis færre' : 'Vis alle'}
                </button>
              )}
              {recentUpdates.length > 0 && (
                <button
                  onClick={onClearUpdates}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Fjern alle
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {displayedUpdates.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              <ClockIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>Ingen nye oppdateringer</p>
            </div>
          ) : (
            displayedUpdates.map((update, index) => {
              const previousConfig = update.previousStatus ? statusConfig[update.previousStatus] : statusConfig.PENDING;
              const newConfig = update.newStatus ? statusConfig[update.newStatus] : statusConfig.PENDING;
              const PreviousIcon = previousConfig.icon;
              const NewIcon = newConfig.icon;

              return (
                <div
                  key={`${update.id}-${index}`}
                  className="px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex items-start space-x-3">
                    {/* Status Change Icons */}
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${previousConfig.bgColor}`}>
                        <PreviousIcon className={`h-4 w-4 ${previousConfig.color}`} />
                      </div>
                      <div className="text-slate-400">→</div>
                      <div className={`p-1 rounded ${newConfig.bgColor}`}>
                        <NewIcon className={`h-4 w-4 ${newConfig.color}`} />
                      </div>
                    </div>

                    {/* Update Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {update.amount.toLocaleString('nb-NO')} kr - {update.stableName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {update.userEmail}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-500">
                          {formatTimestamp(update.timestamp)}
                        </p>
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs px-2 py-1 rounded ${previousConfig.bgColor} ${previousConfig.color}`}>
                            {previousConfig.label}
                          </span>
                          <span className="text-xs text-slate-400">→</span>
                          <span className={`text-xs px-2 py-1 rounded ${newConfig.bgColor} ${newConfig.color}`}>
                            {newConfig.label}
                          </span>
                        </div>
                      </div>
                      {update.failureReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                          <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                          {update.failureReason}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => console.log('View payment details:', update.id)}
                      className="text-slate-400 hover:text-indigo-600"
                      title="Se detaljer"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {recentUpdates.length > 5 && !showAllUpdates && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => setShowAllUpdates(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Vis {recentUpdates.length - 5} flere oppdateringer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}