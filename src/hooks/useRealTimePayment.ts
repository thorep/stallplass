import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';

type Payment = Tables<'payments'>;
type PaymentStatus = NonNullable<Payment['status']>;

interface UseRealTimePaymentOptions {
  paymentId?: string;
  vippsOrderId?: string;
  enableRealtime?: boolean;
  enablePolling?: boolean;
  pollingInterval?: number; // milliseconds
  maxPollingAttempts?: number;
}

export function useRealTimePayment(options: UseRealTimePaymentOptions = {}) {
  const {
    paymentId,
    vippsOrderId,
    enableRealtime = true,
    enablePolling = false,
    pollingInterval = 3000,
    maxPollingAttempts = 20
  } = options;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);

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

      setPayment(data);
      setLastUpdated(new Date());

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
  }, [paymentId, vippsOrderId, enablePolling]);

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

  // Set up basic polling for payment status
  useEffect(() => {
    if (!enablePolling || (!paymentId && !vippsOrderId)) return;

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
  }, [enablePolling, paymentId, vippsOrderId, pollingInterval, maxPollingAttempts, payment?.status, fetchPayment]);

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

  // Check if payment is in final state
  const isFinalState = payment?.status ? 
    ['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status) : false;

  // Check if payment is successful
  const isSuccessful = payment?.status === 'COMPLETED';

  // Check if payment failed
  const isFailed = payment?.status ? ['FAILED', 'CANCELLED'].includes(payment.status) : false;

  // Check if payment is pending/processing
  const isPending = payment?.status ? ['PENDING', 'PROCESSING'].includes(payment.status) : false;

  return {
    payment,
    isLoading,
    error,
    lastUpdated,
    isFinalState,
    isSuccessful,
    isFailed,
    isPending,
    checkStatus,
    retryPayment,
    refresh: fetchPayment,
    clearError: () => setError(null)
  };
}