import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';

type Payment = Tables<'payments'>;

export interface PaymentUpdate {
  id: string;
  previousStatus: NonNullable<Payment['status']>;
  newStatus: NonNullable<Payment['status']>;
  amount: number;
  userEmail: string;
  stableName: string;
  timestamp: Date;
  failureReason?: string | null;
}

export interface PaymentStats {
  totalAmount: number;
  totalCount: number;
  completedAmount: number;
  completedCount: number;
  pendingAmount: number;
  pendingCount: number;
  failedAmount: number;
  failedCount: number;
  processingAmount: number;
  processingCount: number;
  recentActivity: PaymentUpdate[];
}

interface UsePaymentTrackingOptions {
  enableRealtime?: boolean;
  maxRecentActivity?: number;
  trackingTimeWindow?: number; // hours
}

export function usePaymentTracking(options: UsePaymentTrackingOptions = {}) {
  const { 
    enableRealtime = true, 
    maxRecentActivity = 20,
    trackingTimeWindow = 24 
  } = options;
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<PaymentUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const previousPaymentsRef = useRef<Map<string, Payment>>(new Map());

  // Fetch payments with related data
  const fetchPayments = useCallback(async () => {
    try {
      setError(null);
      
      // Calculate time window for recent activity
      const timeWindowStart = new Date();
      timeWindowStart.setHours(timeWindowStart.getHours() - trackingTimeWindow);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          user:users!payments_user_id_fkey(
            email,
            name
          ),
          stable:stables!payments_stable_id_fkey(
            name
          )
        `)
        .gte('opprettet_dato', timeWindowStart.toISOString())
        .order('opprettet_dato', { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      const typedPayments = paymentsData as (Payment & {
        user: { email: string; name: string | null } | null;
        stable: { name: string } | null;
      })[];

      // Calculate payment statistics
      const stats: PaymentStats = {
        totalAmount: 0,
        totalCount: typedPayments.length,
        completedAmount: 0,
        completedCount: 0,
        pendingAmount: 0,
        pendingCount: 0,
        failedAmount: 0,
        failedCount: 0,
        processingAmount: 0,
        processingCount: 0,
        recentActivity: []
      };

      // Track updates since last fetch
      const newUpdates: PaymentUpdate[] = [];
      const previousPayments = previousPaymentsRef.current;

      typedPayments.forEach(payment => {
        const amount = payment.total_belop || 0;
        stats.totalAmount += amount;

        switch (payment.status) {
          case 'COMPLETED':
            stats.completedAmount += amount;
            stats.completedCount++;
            break;
          case 'PENDING':
            stats.pendingAmount += amount;
            stats.pendingCount++;
            break;
          case 'PROCESSING':
            stats.processingAmount += amount;
            stats.processingCount++;
            break;
          case 'FAILED':
            stats.failedAmount += amount;
            stats.failedCount++;
            break;
        }

        // Check for status changes
        const previousPayment = previousPayments.get(payment.id);
        if (previousPayment && 
            previousPayment.status !== payment.status &&
            previousPayment.status && 
            payment.status) {
          newUpdates.push({
            id: payment.id,
            previousStatus: previousPayment.status,
            newStatus: payment.status,
            amount: amount,
            userEmail: payment.user?.email || 'Unknown',
            stableName: payment.stable?.name || 'Unknown',
            timestamp: new Date(payment.updated_at || payment.opprettet_dato || ''),
            failureReason: payment.feil_arsak
          });
        }
      });

      // Update previous payments reference
      previousPaymentsRef.current = new Map(
        typedPayments.map(payment => [payment.id, payment])
      );

      // Update recent activity
      if (newUpdates.length > 0) {
        setRecentUpdates(prev => {
          const combined = [...newUpdates, ...prev];
          return combined.slice(0, maxRecentActivity);
        });
      }

      setPayments(typedPayments);
      setPaymentStats(stats);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  }, [trackingTimeWindow, maxRecentActivity]);

  // Set up real-time subscription for payments
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel('admin-payment-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        async (payload) => {
          console.log('Payment change detected:', payload);
          
          // Refresh data when payments change
          await fetchPayments();
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
  }, [enableRealtime, fetchPayments]);

  // Initial load
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Get payments by status
  const getPaymentsByStatus = useCallback((status: NonNullable<Payment['status']>) => {
    return payments.filter(payment => payment.status === status);
  }, [payments]);

  // Get pending payments (needs attention)
  const getPendingPayments = useCallback(() => {
    return payments.filter(payment => 
      payment.status === 'PENDING' || payment.status === 'PROCESSING'
    );
  }, [payments]);

  // Get failed payments (needs review)
  const getFailedPayments = useCallback(() => {
    return payments.filter(payment => payment.status === 'FAILED');
  }, [payments]);

  // Get recent high-value payments
  const getHighValuePayments = useCallback((minAmount: number = 1000) => {
    return payments.filter(payment => 
      (payment.total_belop || 0) >= minAmount
    ).slice(0, 10);
  }, [payments]);

  // Clear recent updates
  const clearRecentUpdates = useCallback(() => {
    setRecentUpdates([]);
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    paymentStats,
    recentUpdates,
    isLoading,
    error,
    lastUpdated,
    getPaymentsByStatus,
    getPendingPayments,
    getFailedPayments,
    getHighValuePayments,
    clearRecentUpdates,
    refresh,
    clearError: () => setError(null)
  };
}