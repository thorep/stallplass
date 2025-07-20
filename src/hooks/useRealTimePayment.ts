import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';
import { startPaymentPolling, stopPaymentPolling, getPollingSession } from '@/services/payment-polling-service';

type Payment = Tables<'payments'>;
type PaymentStatus = NonNullable<Payment['status']>;

export interface PaymentStatusUpdate {
  paymentId: string;
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
  timestamp: Date;
  failureReason?: string | null;
  metadata?: any;
}

export interface PaymentProgress {
  stage: 'initiated' | 'processing' | 'authorization' | 'capture' | 'completed' | 'failed';
  message: string;
  percentage: number;
  timestamp: Date;
}

interface UseRealTimePaymentOptions {
  paymentId?: string;
  vippsOrderId?: string;
  enableRealtime?: boolean;
  enablePolling?: boolean;
  pollingInterval?: number; // milliseconds
  maxPollingAttempts?: number;
  useAdvancedPolling?: boolean; // Use the polling service instead of basic polling
}

export function useRealTimePayment(options: UseRealTimePaymentOptions = {}) {
  const {
    paymentId,
    vippsOrderId,
    enableRealtime = true,
    enablePolling = false,
    pollingInterval = 3000,
    maxPollingAttempts = 20,
    useAdvancedPolling = true
  } = options;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<PaymentStatusUpdate[]>([]);
  const [progress, setProgress] = useState<PaymentProgress[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);
  const pollingSessionRef = useRef<string | null>(null);

  // Convert payment status to progress information
  const getProgressForStatus = useCallback((status: PaymentStatus, failureReason?: string | null): PaymentProgress => {
    const timestamp = new Date();
    
    switch (status) {
      case 'PENDING':
        return {
          stage: 'initiated',
          message: 'Betaling opprettet og venter på behandling',
          percentage: 20,
          timestamp
        };
      case 'PROCESSING':
        return {
          stage: 'processing',
          message: 'Behandler betaling med Vipps',
          percentage: 40,
          timestamp
        };
      case 'COMPLETED':
        return {
          stage: 'completed',
          message: 'Betaling fullført og bekreftet',
          percentage: 100,
          timestamp
        };
      case 'FAILED':
        return {
          stage: 'failed',
          message: failureReason || 'Betaling feilet',
          percentage: 0,
          timestamp
        };
      case 'CANCELLED':
        return {
          stage: 'failed',
          message: 'Betaling kansellert av bruker',
          percentage: 0,
          timestamp
        };
      case 'REFUNDED':
        return {
          stage: 'failed',
          message: 'Betaling refundert',
          percentage: 0,
          timestamp
        };
      default:
        return {
          stage: 'initiated',
          message: 'Ukjent status',
          percentage: 10,
          timestamp
        };
    }
  }, []);

  // Fetch payment data
  const fetchPayment = useCallback(async () => {
    if (!paymentId && !vippsOrderId) return;

    try {
      setError(null);

      let query = supabase
        .from('payments')
        .select(`
          *,
          user:users!payments_user_id_fkey(
            email,
            name
          ),
          stable:stables!payments_stable_id_fkey(
            name,
            owner:users!stables_owner_id_fkey(
              email,
              name
            )
          )
        `);

      if (paymentId) {
        query = query.eq('id', paymentId);
      } else if (vippsOrderId) {
        query = query.eq('vipps_order_id', vippsOrderId);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) {
        throw fetchError;
      }

      const previousPayment = payment;
      setPayment(data);
      setLastUpdated(new Date());

      // Track status updates
      if (previousPayment && 
          previousPayment.status !== data.status && 
          previousPayment.status && 
          data.status) {
        const update: PaymentStatusUpdate = {
          paymentId: data.id,
          previousStatus: previousPayment.status,
          newStatus: data.status,
          timestamp: new Date(),
          failureReason: data.failure_reason,
          metadata: data.metadata
        };

        setStatusUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
      }

      // Update progress
      if (data.status) {
        const newProgress = getProgressForStatus(data.status, data.failure_reason);
        setProgress(prev => {
          // Don't add duplicate progress entries
          if (prev.length > 0 && prev[prev.length - 1].stage === newProgress.stage) {
            return prev;
          }
          return [...prev, newProgress];
        });
      }

      // Stop polling if payment is in final state
      if (enablePolling && data.status && ['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(data.status)) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }

    } catch (err) {
      console.error('Error fetching payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment');
    } finally {
      setIsLoading(false);
    }
  }, [paymentId, vippsOrderId, payment, getProgressForStatus, enablePolling]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enableRealtime || (!paymentId && !vippsOrderId)) return;

    const channel = supabase
      .channel(`payment-${paymentId || vippsOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: paymentId ? `id=eq.${paymentId}` : `vipps_order_id=eq.${vippsOrderId}`
        },
        async (payload) => {
          console.log('Payment update received:', payload);
          await fetchPayment();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enableRealtime, paymentId, vippsOrderId, fetchPayment]);

  // Set up polling for payment status
  useEffect(() => {
    if (!enablePolling || (!paymentId && !vippsOrderId)) return;

    if (useAdvancedPolling && paymentId && vippsOrderId) {
      // Use advanced polling service
      const sessionId = startPaymentPolling(paymentId, vippsOrderId, {
        intervalMs: pollingInterval,
        maxAttempts: maxPollingAttempts,
        enableRealTimeBroadcast: true
      });
      
      pollingSessionRef.current = sessionId;
      console.log(`Started advanced polling session: ${sessionId}`);

      return () => {
        if (pollingSessionRef.current) {
          stopPaymentPolling(pollingSessionRef.current);
          pollingSessionRef.current = null;
        }
      };
    } else {
      // Use basic polling (fallback)
      const startBasicPolling = () => {
        if (pollingRef.current) return; // Already polling

        pollingRef.current = setInterval(async () => {
          pollingAttemptsRef.current++;
          
          // Stop polling after max attempts or if payment is in final state
          if (pollingAttemptsRef.current >= maxPollingAttempts ||
              (payment?.status && ['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status))) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            return;
          }

          await fetchPayment();
        }, pollingInterval);
      };

      // Start polling if payment is in non-final state
      if (!payment?.status || ['PENDING', 'PROCESSING'].includes(payment.status)) {
        startBasicPolling();
      }

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [enablePolling, paymentId, vippsOrderId, pollingInterval, maxPollingAttempts, payment?.status, fetchPayment, useAdvancedPolling]);

  // Initial load
  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  // Check payment status manually (useful for manual refresh)
  const checkStatus = useCallback(async () => {
    if (!payment?.vipps_order_id) return;

    try {
      const response = await fetch('/api/payments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vippsOrderId: payment.vipps_order_id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check payment status');
    }
  }, [payment?.vipps_order_id]);

  // Retry failed payment
  const retryPayment = useCallback(async () => {
    if (!payment || payment.status !== 'FAILED') return;

    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('/api/payments/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to retry payment');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error retrying payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry payment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [payment]);

  // Get current progress percentage
  const currentProgress = progress.length > 0 ? progress[progress.length - 1] : null;

  // Check if payment is in final state
  const isFinalState = payment?.status ? 
    ['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status) : false;

  // Check if payment is successful
  const isSuccessful = payment?.status === 'COMPLETED';

  // Check if payment failed
  const isFailed = payment?.status ? ['FAILED', 'CANCELLED'].includes(payment.status) : false;

  // Get estimated completion time (rough estimate based on current progress)
  const getEstimatedCompletion = useCallback(() => {
    if (!currentProgress || isFinalState) return null;

    const now = new Date();
    const elapsed = now.getTime() - (progress[0]?.timestamp.getTime() || now.getTime());
    const progressRate = currentProgress.percentage / elapsed;
    const remainingTime = (100 - currentProgress.percentage) / progressRate;

    return new Date(now.getTime() + remainingTime);
  }, [currentProgress, isFinalState, progress]);

  // Get polling session info
  const getPollingInfo = useCallback(() => {
    if (!pollingSessionRef.current) return null;
    return getPollingSession(pollingSessionRef.current);
  }, []);

  return {
    payment,
    isLoading,
    error,
    statusUpdates,
    progress,
    currentProgress,
    lastUpdated,
    isFinalState,
    isSuccessful,
    isFailed,
    estimatedCompletion: getEstimatedCompletion(),
    pollingInfo: getPollingInfo(),
    pollingSessionId: pollingSessionRef.current,
    checkStatus,
    retryPayment,
    refresh: fetchPayment,
    clearError: () => setError(null),
    clearStatusUpdates: () => setStatusUpdates([]),
    clearProgress: () => setProgress([]),
    stopPolling: () => {
      if (pollingSessionRef.current) {
        stopPaymentPolling(pollingSessionRef.current);
        pollingSessionRef.current = null;
      }
    }
  };
}