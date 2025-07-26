'use client';

import { useState, useEffect } from 'react';
import { formatDate, formatPrice } from '@/utils/formatting';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  CreditCardIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { usePaymentTracking, PaymentStats } from '@/hooks/usePaymentTracking';
import { useRealTimePayment } from '@/hooks/useRealTimePayment';
import { PaymentStatus, PaymentMethod } from '@/generated/prisma';
import { AdminPayment } from '@/types/admin';

interface PaymentsAdminProps {
  initialPayments: AdminPayment[];
}

const statusConfig: Record<PaymentStatus, { label: string; color: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  PENDING: { label: 'Venter', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  PROCESSING: { label: 'Behandler', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  COMPLETED: { label: 'Fullført', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  FAILED: { label: 'Feilet', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  REFUNDED: { label: 'Refundert', color: 'bg-purple-100 text-purple-800', icon: BanknotesIcon },
  CANCELLED: { label: 'Kansellert', color: 'bg-slate-100 text-slate-800', icon: XCircleIcon },
};

const paymentMethodConfig: Record<PaymentMethod, { label: string; color: string }> = {
  VIPPS: { label: 'Vipps', color: 'bg-orange-100 text-orange-800' },
  CARD: { label: 'Kort', color: 'bg-blue-100 text-blue-800' },
  BYPASS: { label: 'Omgått', color: 'bg-gray-100 text-gray-800' },
};

export function PaymentsAdmin({ initialPayments }: PaymentsAdminProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Real-time payment tracking
  const {
    isLoading: isLoadingTracking,
    error: trackingError,
    refetch: refresh
  } = usePaymentTracking(undefined, 3000);

  // Extract data with fallbacks
  const livePayments: AdminPayment[] = [];
  const paymentStats: PaymentStats | null = null;
  const lastUpdated = new Date();
  
  // Use live payments if available, fallback to prop payments
  const payments = livePayments.length > 0 ? livePayments : initialPayments;
  

  // Real-time tracking for selected payment
  const {
    payment: selectedPayment,
    retryPayment
  } = useRealTimePayment({
    paymentId: selectedPaymentId || undefined,
    enableRealtime: true,
    enablePolling: true
  });

  const filteredPayments = payments.filter((payment: AdminPayment) => {
    const matchesSearch = 
      payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.stable?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vippsOrderId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get real-time statistics
  const completedPayments = payments.filter((p: AdminPayment) => p.status === 'COMPLETED');
  const pendingPayments = payments.filter((p: AdminPayment) => p.status === 'PENDING' || p.status === 'PROCESSING');
  const failedPayments = payments.filter((p: AdminPayment) => p.status === 'FAILED' || p.status === 'CANCELLED');
  
  const stats = paymentStats || {
    totalPayments: payments.length,
    successfulPayments: completedPayments.length,
    failedPayments: failedPayments.length,
    totalAmount: completedPayments.reduce((sum: number, p: AdminPayment) => sum + (p.totalAmount || 0), 0),
    averageAmount: completedPayments.length > 0 ? completedPayments.reduce((sum: number, p: AdminPayment) => sum + (p.totalAmount || 0), 0) / completedPayments.length : 0,
    pendingPayments: pendingPayments.length,
    // Additional properties for the UI
    pendingAmount: pendingPayments.reduce((sum: number, p: AdminPayment) => sum + (p.totalAmount || 0), 0),
    completedAmount: completedPayments.reduce((sum: number, p: AdminPayment) => sum + (p.totalAmount || 0), 0),
    completedCount: completedPayments.length,
    failedAmount: failedPayments.reduce((sum: number, p: AdminPayment) => sum + (p.totalAmount || 0), 0),
    totalCount: payments.length,
    recentActivity: []
  } as PaymentStats & {
    pendingAmount: number;
    completedAmount: number;
    completedCount: number;
    failedAmount: number;
    totalCount: number;
    recentActivity: unknown[];
  };

  // Use the filtered arrays from stats calculation above

  // Handle payment selection
  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPaymentId(paymentId === selectedPaymentId ? null : paymentId);
  };

  // Handle retry payment
  const handleRetryPayment = async (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    try {
      await retryPayment();
    } catch (error) {
      console.error('Failed to retry payment:', error);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Betalinger</h2>
          <div className="flex items-center space-x-3">
            
            {/* Refresh button */}
            <button
              onClick={() => refresh()}
              disabled={isLoadingTracking}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${
                isLoadingTracking ? 'animate-spin' : ''
              }`} />
            </button>
            
            {/* Last updated */}
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Sist oppdatert: {formatDate(lastUpdated.toISOString())}
              </span>
            )}
          </div>
        </div>
        
        {/* Error display */}
        {trackingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{String(trackingError)}</span>
            </div>
          </div>
        )}
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600">Total omsetning</p>
                <p className="text-xl font-bold text-slate-900">{formatPrice(stats.completedAmount || 0)}</p>
                <p className="text-xs text-slate-500">{stats.completedCount || 0} fullførte</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center">
              <ClockIcon className={`h-8 w-8 ${
                pendingPayments.length > 0 ? 'text-yellow-600' : 'text-gray-400'
              }`} />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600">Ventende betalinger</p>
                <p className="text-xl font-bold text-slate-900">{formatPrice(stats.pendingAmount || 0)}</p>
                <p className="text-xs text-slate-500">{pendingPayments.length} ventende</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center">
              <XCircleIcon className={`h-8 w-8 ${
                failedPayments.length > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600">Feilede betalinger</p>
                <p className="text-xl font-bold text-slate-900">{formatPrice(stats.failedAmount || 0)}</p>
                <p className="text-xs text-slate-500">{failedPayments.length} feilet</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600">Totale transaksjoner</p>
                <p className="text-xl font-bold text-slate-900">{stats.totalCount || 0}</p>
                <p className="text-xs text-slate-500">siste 48t</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Søk etter bruker, stall eller ordre-ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alle statuser</option>
              <option value="PENDING">Venter</option>
              <option value="PROCESSING">Behandler</option>
              <option value="COMPLETED">Fullført</option>
              <option value="FAILED">Feilet</option>
              <option value="REFUNDED">Refundert</option>
              <option value="CANCELLED">Kansellert</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Bruker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stall
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Detaljer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Beløp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Dato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPayments.map((payment: AdminPayment) => {
                  const statusInfo = statusConfig[payment.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  const methodInfo = paymentMethodConfig[payment.paymentMethod] || paymentMethodConfig.VIPPS;
                  
                  return (
                    <tr 
                      key={payment.id} 
                      className={`hover:bg-slate-50 cursor-pointer ${
                        selectedPaymentId === payment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handlePaymentSelect(payment.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {payment.vippsOrderId}
                          </div>
                          {payment.vippsReference && (
                            <div className="text-xs text-slate-500">
                              Ref: {payment.vippsReference}
                            </div>
                          )}
                          {selectedPaymentId === payment.id && selectedPayment && (
                            <div className="mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetryPayment(payment.id);
                                }}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                disabled={payment.status !== 'FAILED'}
                              >
                                Prøv på nytt
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-slate-900">
                            {payment.user?.name || 'Ingen navn'}
                          </div>
                          <div className="text-xs text-slate-500">{payment.user?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-slate-900">{payment.stable?.name}</div>
                          <div className="text-xs text-slate-500">
                            Eier: {payment.stable?.owner?.name || payment.stable?.owner?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>
                          <div>{payment.months} måneder</div>
                          {payment.discount && payment.discount > 0 && (
                            <div className="text-green-600">
                              {(payment.discount * 100).toFixed(0)}% rabatt
                            </div>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${methodInfo.color}`}>
                            {methodInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {formatPrice(payment.totalAmount)}
                          </div>
                          {payment.discount && payment.discount > 0 && (
                            <div className="text-xs text-slate-500 line-through">
                              {formatPrice(payment.amount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                        {payment.failureReason && (
                          <div className="text-xs text-red-600 mt-1">
                            {payment.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>
                          <div>Opprettet: {formatDate(payment.createdAt?.toISOString() || '')}</div>
                          {payment.paidAt && (
                            <div className="text-green-600">Betalt: {formatDate(payment.paidAt.toISOString())}</div>
                          )}
                          {payment.failedAt && (
                            <div className="text-red-600">Feilet: {formatDate(payment.failedAt.toISOString())}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Ingen betalinger funnet
          </div>
        )}
      </div>
    </div>
  );
}