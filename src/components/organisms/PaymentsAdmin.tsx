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
  ExclamationTriangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { usePaymentTracking, PaymentUpdate } from '@/hooks/usePaymentTracking';
import { useRealTimePayment } from '@/hooks/useRealTimePayment';

interface AdminPayment {
  id: string;
  amount: number;
  months: number;
  discount: number;
  totalAmount: number;
  vippsOrderId: string;
  vippsReference: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod: 'VIPPS' | 'CARD';
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  user: {
    id: string;
    firebaseId: string;
    email: string;
    name: string | null;
  };
  stable: {
    id: string;
    name: string;
    owner: {
      email: string;
      name: string | null;
    };
  };
}

interface PaymentsAdminProps {
  initialPayments: AdminPayment[];
}

const statusConfig = {
  PENDING: { label: 'Venter', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  PROCESSING: { label: 'Behandler', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  COMPLETED: { label: 'Fullført', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  FAILED: { label: 'Feilet', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  REFUNDED: { label: 'Refundert', color: 'bg-purple-100 text-purple-800', icon: BanknotesIcon },
  CANCELLED: { label: 'Kansellert', color: 'bg-slate-100 text-slate-800', icon: XCircleIcon },
};

const paymentMethodConfig = {
  VIPPS: { label: 'Vipps', color: 'bg-orange-100 text-orange-800' },
  CARD: { label: 'Kort', color: 'bg-blue-100 text-blue-800' },
};

export function PaymentsAdmin({ initialPayments }: PaymentsAdminProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Real-time payment tracking
  const {
    payments: livePayments,
    paymentStats,
    recentUpdates,
    isLoading: isLoadingTracking,
    error: trackingError,
    lastUpdated,
    getPendingPayments,
    getFailedPayments,
    clearRecentUpdates,
    refresh
  } = usePaymentTracking({
    enableRealtime: true,
    maxRecentActivity: 50,
    trackingTimeWindow: 48 // 48 hours
  });

  // Use live payments if available, fallback to initial payments
  const payments = livePayments.length > 0 ? livePayments : initialPayments;

  // Real-time tracking for selected payment
  const {
    payment: selectedPayment,
    currentProgress,
    isSuccessful,
    isFailed,
    retryPayment
  } = useRealTimePayment({
    paymentId: selectedPaymentId || undefined,
    enableRealtime: true,
    enablePolling: true
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.stable?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vippsOrderId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get real-time statistics
  const stats = paymentStats || {
    totalAmount: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    pendingAmount: payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    totalCount: payments.length,
    recentActivity: []
  };

  const pendingPayments = getPendingPayments();
  const failedPayments = getFailedPayments();

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
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg border ${
                  recentUpdates.length > 0 
                    ? 'border-orange-300 bg-orange-50 text-orange-700' 
                    : 'border-gray-300 bg-white text-gray-600'
                } hover:bg-gray-50 transition-colors`}
              >
                <BellIcon className="h-5 w-5" />
                {recentUpdates.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {recentUpdates.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Nylige oppdateringer</h3>
                      <button
                        onClick={clearRecentUpdates}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Tøm alle
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {recentUpdates.length > 0 ? (
                      <div className="p-2">
                        {recentUpdates.map((update, index) => (
                          <div key={index} className="p-2 hover:bg-gray-50 rounded text-sm">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${
                                update.newStatus === 'COMPLETED' ? 'text-green-700' :
                                update.newStatus === 'FAILED' ? 'text-red-700' : 'text-blue-700'
                              }`}>
                                {update.newStatus === 'COMPLETED' ? 'Fullført' :
                                 update.newStatus === 'FAILED' ? 'Feilet' : 'Oppdatert'}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {formatDate(update.timestamp.toISOString())}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              {update.userEmail} - {formatPrice(update.amount)}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {update.stableName}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Ingen nye oppdateringer
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Refresh button */}
            <button
              onClick={refresh}
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
              <span className="text-red-700">{trackingError}</span>
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
                {filteredPayments.map((payment) => {
                  const statusInfo = statusConfig[payment.status];
                  const StatusIcon = statusInfo.icon;
                  const methodInfo = paymentMethodConfig[payment.paymentMethod];
                  
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
                          {payment.discount > 0 && (
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
                          {payment.discount > 0 && (
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
                        {selectedPaymentId === payment.id && currentProgress && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${currentProgress.percentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {currentProgress.message}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>
                          <div>Opprettet: {formatDate(payment.createdAt)}</div>
                          {payment.paidAt && (
                            <div className="text-green-600">Betalt: {formatDate(payment.paidAt)}</div>
                          )}
                          {payment.failedAt && (
                            <div className="text-red-600">Feilet: {formatDate(payment.failedAt)}</div>
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