'use client';

import { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { usePaymentTracking } from '@/hooks/usePaymentTracking';
import { useRealTimePayment } from '@/hooks/useRealTimePayment';
import { formatPrice, formatDate } from '@/utils/formatting';
import { Tables } from '@/types/supabase';

type Payment = Tables<'payments'>;

interface PaymentFailureRecoveryProps {
  userId: string;
  isAdmin?: boolean;
  maxFailures?: number;
  autoCheckInterval?: number; // minutes
  onPaymentRecovered?: (payment: Payment) => void;
  onPaymentAbandoned?: (payment: Payment) => void;
}

interface FailureRecoveryAction {
  type: 'retry' | 'contact_support' | 'alternative_method' | 'abandon';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'high' | 'medium' | 'low';
}

const recoveryActions: FailureRecoveryAction[] = [
  {
    type: 'retry',
    label: 'Prøv betaling på nytt',
    description: 'Start en ny betalingsprosess med samme detaljer',
    icon: ArrowPathIcon,
    priority: 'high'
  },
  {
    type: 'contact_support',
    label: 'Kontakt kundeservice',
    description: 'Få hjelp fra vårt supportteam',
    icon: ExclamationTriangleIcon,
    priority: 'medium'
  },
  {
    type: 'alternative_method',
    label: 'Alternativ payment_method',
    description: 'Prøv en annen payment_method',
    icon: BanknotesIcon,
    priority: 'medium'
  },
  {
    type: 'abandon',
    label: 'Avbryt betaling',
    description: 'Gi opp denne betalingen',
    icon: XCircleIcon,
    priority: 'low'
  }
];

export default function PaymentFailureRecovery({
  isAdmin = false,
  maxFailures = 20,
  autoCheckInterval = 5,
  onPaymentRecovered,
  onPaymentAbandoned
}: PaymentFailureRecoveryProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [recoveryInProgress, setRecoveryInProgress] = useState<string | null>(null);
  const [lastAutoCheck, setLastAutoCheck] = useState<Date>(new Date());

  // Get failed payments
  const {
    getFailedPayments,
    paymentStats,
    refresh: refreshPayments
  } = usePaymentTracking({
    enableRealtime: true,
    maxRecentActivity: 100,
    trackingTimeWindow: 72 // 3 days
  });

  // Real-time tracking for selected payment
  const {
    payment: livePayment,
    retryPayment,
    error: paymentError
  } = useRealTimePayment({
    paymentId: selectedPayment?.id,
    enableRealtime: true,
    enablePolling: true
  });

  const failedPayments = getFailedPayments().slice(0, maxFailures);

  // Auto-check for recovery opportunities
  useEffect(() => {
    if (!isAdmin) return; // Only for admin monitoring

    const interval = setInterval(() => {
      refreshPayments();
      setLastAutoCheck(new Date());
    }, autoCheckInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAdmin, autoCheckInterval, refreshPayments]);

  // Handle payment recovery success
  useEffect(() => {
    if (livePayment?.status === 'COMPLETED') {
      setRecoveryInProgress(null);
      onPaymentRecovered?.(livePayment);
    }
  }, [livePayment, onPaymentRecovered]);

  const getFailureReasonCategory = (reason: string | null) => {
    if (!reason) return 'unknown';
    
    const reasonLower = reason.toLowerCase();
    
    if (reasonLower.includes('insufficient') || reasonLower.includes('balance')) {
      return 'insufficient_funds';
    }
    if (reasonLower.includes('expired') || reasonLower.includes('timeout')) {
      return 'expired';
    }
    if (reasonLower.includes('cancelled') || reasonLower.includes('aborted')) {
      return 'user_cancelled';
    }
    if (reasonLower.includes('network') || reasonLower.includes('connection')) {
      return 'technical';
    }
    if (reasonLower.includes('card') || reasonLower.includes('payment method')) {
      return 'payment_method';
    }
    
    return 'other';
  };

  const getRecoveryRecommendations = (payment: Payment) => {
    const category = getFailureReasonCategory(payment.failure_reason);
    
    switch (category) {
      case 'insufficient_funds':
        return recoveryActions.filter(a => ['contact_support', 'alternative_method'].includes(a.type));
      case 'expired':
        return recoveryActions.filter(a => ['retry', 'contact_support'].includes(a.type));
      case 'user_cancelled':
        return recoveryActions.filter(a => ['retry', 'abandon'].includes(a.type));
      case 'technical':
        return recoveryActions.filter(a => ['retry', 'contact_support', 'alternative_method'].includes(a.type));
      case 'payment_method':
        return recoveryActions.filter(a => ['alternative_method', 'contact_support'].includes(a.type));
      default:
        return recoveryActions;
    }
  };

  const handleRecoveryAction = async (payment: Payment, action: FailureRecoveryAction) => {
    setRecoveryInProgress(payment.id);
    
    try {
      switch (action.type) {
        case 'retry':
          setSelectedPayment(payment);
          await retryPayment();
          break;
          
        case 'contact_support':
          // Open support contact
          window.open(`mailto:support@stallplass.no?subject=Betalingsproblem ${payment.vipps_order_id}&body=Hei,%0D%0A%0D%0AJeg har problemer med betaling ${payment.vipps_order_id}.%0D%0AFeilmelding: ${payment.failure_reason}%0D%0A%0D%0AVennlig hilsen`);
          break;
          
        case 'alternative_method':
          // Redirect to alternative payment flow
          window.location.href = `/dashboard/payment/alternative?paymentId=${payment.id}`;
          break;
          
        case 'abandon':
          onPaymentAbandoned?.(payment);
          break;
      }
    } catch (error) {
      console.error('Recovery action failed:', error);
    } finally {
      setRecoveryInProgress(null);
    }
  };

  const getFailureSeverity = (payment: Payment) => {
    const hoursAgo = (new Date().getTime() - new Date(payment.feilet_dato || payment.created_at || '').getTime()) / (1000 * 60 * 60);
    const amount = payment.total_amount || 0;
    
    if (hoursAgo > 48 && amount > 1000) return 'critical';
    if (hoursAgo > 24 || amount > 500) return 'high';
    if (hoursAgo > 12 || amount > 100) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  if (failedPayments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ingen feilede betalinger
          </h3>
          <p className="text-gray-600">
            Alle betalinger fungerer som forventet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Betalingsgjenoppretting
          </h2>
          <p className="text-gray-600 mt-1">
            {failedPayments.length} feilede betaling{failedPayments.length !== 1 ? 'er' : ''} krever oppmerksomhet
          </p>
        </div>
        
        {isAdmin && (
          <div className="text-sm text-gray-500">
            Sist sjekket: {formatDate(lastAutoCheck.toISOString())}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {isAdmin && paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Totalt feilet</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(paymentStats.failedAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Antall feil</p>
                <p className="text-xl font-bold text-gray-900">{paymentStats.failedCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <ArrowPathIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Gjenopprettingsrate</p>
                <p className="text-xl font-bold text-gray-900">
                  {paymentStats.totalCount > 0 
                    ? Math.round((paymentStats.completedCount / (paymentStats.completedCount + paymentStats.failedCount)) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failed Payments List */}
      <div className="space-y-4">
        {failedPayments.map((payment) => {
          const severity = getFailureSeverity(payment);
          const recommendations = getRecoveryRecommendations(payment);
          const isProcessing = recoveryInProgress === payment.id;
          
          return (
            <div 
              key={payment.id} 
              className={`border rounded-lg p-6 ${getSeverityColor(severity)}`}
            >
              {/* Payment Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Betaling feilet - {formatPrice(payment.total_amount || 0)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ordre: {payment.vipps_order_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Feilet: {formatDate(payment.feilet_dato || payment.created_at || '')}
                  </p>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  severity === 'critical' ? 'bg-red-100 text-red-800' :
                  severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {severity === 'critical' ? 'Kritisk' :
                   severity === 'high' ? 'Høy' :
                   severity === 'medium' ? 'Medium' : 'Lav'} prioritet
                </div>
              </div>

              {/* Failure Details */}
              {payment.failure_reason && (
                <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">Feilmelding:</p>
                  <p className="text-sm text-red-600">{payment.failure_reason}</p>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Periode</p>
                  <p className="text-gray-600">{payment.months} måned{payment.months !== 1 ? 'er' : ''}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Rabatt</p>
                  <p className="text-gray-600">{payment.discount ? `${(payment.discount * 100).toFixed(0)}%` : 'Ingen'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Betalingsmetode</p>
                  <p className="text-gray-600">{payment.payment_method}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Status</p>
                  <p className="text-red-600 font-medium">{payment.status}</p>
                </div>
              </div>

              {/* Recovery Actions */}
              <div>
                <p className="font-medium text-gray-900 mb-3">Anbefalte handlinger:</p>
                <div className="flex flex-wrap gap-2">
                  {recommendations.map((action) => {
                    const Icon = action.icon;
                    const isPrimaryAction = action.priority === 'high';
                    
                    return (
                      <Button
                        key={action.type}
                        variant={isPrimaryAction ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleRecoveryAction(payment, action)}
                        disabled={isProcessing}
                        className={`flex items-center space-x-2 ${
                          isPrimaryAction ? '' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{action.label}</span>
                        {isProcessing && (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Error Display */}
              {paymentError && selectedPayment?.id === payment.id && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">{paymentError}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}