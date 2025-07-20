'use client';

import { useRealTimePayment } from '@/hooks/useRealTimePayment';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PaymentNotificationsProps {
  paymentId?: string;
  vippsOrderId?: string;
  showStatusText?: boolean;
}

export default function PaymentNotifications({
  paymentId,
  vippsOrderId,
  showStatusText = true
}: PaymentNotificationsProps) {
  const { payment, isLoading, isSuccessful, isFailed, isPending } = useRealTimePayment({
    paymentId,
    vippsOrderId,
    enableRealtime: true
  });

  if (isLoading || !payment) {
    return null;
  }

  const getStatusIcon = () => {
    if (isSuccessful) {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    }
    if (isFailed) {
      return <XCircleIcon className="h-5 w-5 text-red-600" />;
    }
    if (isPending) {
      return <ClockIcon className="h-5 w-5 text-blue-600" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (isSuccessful) return 'Betaling fullført';
    if (isFailed) return 'Betaling feilet';
    if (isPending) return 'Behandler betaling';
    return 'Ukjent status';
  };

  const getStatusColor = () => {
    if (isSuccessful) return 'text-green-600';
    if (isFailed) return 'text-red-600';
    if (isPending) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex items-center space-x-2">
      {getStatusIcon()}
      {showStatusText && (
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}