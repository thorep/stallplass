'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import type { payments, PaymentStatus, PaymentMethod } from '@/generated/prisma';

/**
 * TanStack Query hooks for payment tracking and management
 * 
 * Note: Payment services are not yet migrated to Prisma.
 * These hooks provide the structure and can be updated when
 * payment services are migrated from Supabase.
 */

// Types for payment operations
export interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalAmount: number;
  averageAmount: number;
  pendingPayments: number;
}

export interface CreatePaymentData {
  userId: string;
  stableId: string;
  amount: number;
  months: number;
  discount?: number;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  id: string;
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  createdAt: Date;
}

export interface ProcessPaymentVariables {
  paymentId: string;
  status?: PaymentStatus;
}

export interface VippsPaymentResponse {
  paymentId: string;
  orderId: string;
  url?: string;
}

// Query key factory for payment queries
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...paymentKeys.lists(), { filters }] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  byUser: (userId: string) => [...paymentKeys.all, 'by-user', userId] as const,
  stats: (userId?: string) => [...paymentKeys.all, 'stats', userId || 'all'] as const,
  tracking: (paymentId: string) => [...paymentKeys.detail(paymentId), 'tracking'] as const,
};

/**
 * Payment tracking hook for real-time payment status updates
 */
export function usePaymentTracking(paymentId: string | undefined, pollingInterval: number = 3000) {
  return useQuery({
    queryKey: paymentKeys.tracking(paymentId || ''),
    queryFn: async () => {
      // TODO: Implement when payment service is migrated to Prisma
      // For now, return placeholder data
      return {
        id: paymentId,
        status: 'PENDING' as PaymentStatus,
        amount: 0,
        paymentMethod: 'VIPPS' as PaymentMethod,
        createdAt: new Date(),
        paidAt: null,
        failedAt: null,
        failureReason: null,
      };
    },
    enabled: !!paymentId,
    staleTime: 1000, // Very short for real-time tracking
    refetchInterval: pollingInterval,
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get user payment history
 */
export function useUserPayments(userId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.byUser(userId || ''),
    queryFn: async () => {
      // TODO: Implement when payment service is migrated to Prisma
      return [] as payments[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get payment statistics
 */
export function usePaymentStats(userId?: string) {
  return useQuery({
    queryKey: paymentKeys.stats(userId),
    queryFn: async (): Promise<PaymentStats> => {
      // TODO: Implement when payment service is migrated to Prisma
      return {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        pendingPayments: 0,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Create payment mutation
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<PaymentResponse> => {
      // TODO: Implement when payment service is migrated to Prisma
      throw new Error('Payment creation not yet implemented with Prisma');
    },
    onSuccess: (newPayment: PaymentResponse) => {
      // Invalidate payment queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      
      // Add optimistic update for payment tracking
      if (newPayment) {
        queryClient.setQueryData(
          paymentKeys.detail(newPayment.id),
          newPayment
        );
      }
    },
    throwOnError: false,
  });
}

/**
 * Process payment mutation (for admin use)
 */
export function useProcessPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // TODO: Implement when payment service is migrated to Prisma
      throw new Error('Payment processing not yet implemented with Prisma');
    },
    onSuccess: (_, variables: ProcessPaymentVariables) => {
      // Invalidate specific payment and lists
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(variables.paymentId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
    throwOnError: false,
  });
}

/**
 * Payment method management
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      return [
        { id: 'VIPPS', name: 'Vipps', available: true },
        { id: 'CARD', name: 'Kort', available: true },
        { id: 'BYPASS', name: 'Bypass (Admin)', available: false },
      ];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - payment methods rarely change
    retry: 1,
    throwOnError: false,
  });
}

/**
 * Payment failure recovery hook
 */
export function usePaymentFailureRecovery(paymentId: string | undefined) {
  const queryClient = useQueryClient();
  
  const retryPayment = useMutation({
    mutationFn: async () => {
      // TODO: Implement payment retry logic
      throw new Error('Payment retry not yet implemented');
    },
    onSuccess: () => {
      // Restart payment tracking
      queryClient.invalidateQueries({ 
        queryKey: paymentKeys.tracking(paymentId || '') 
      });
    },
    throwOnError: false,
  });
  
  const cancelPayment = useMutation({
    mutationFn: async () => {
      // TODO: Implement payment cancellation
      throw new Error('Payment cancellation not yet implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: paymentKeys.detail(paymentId || '') 
      });
    },
    throwOnError: false,
  });
  
  return {
    retryPayment,
    cancelPayment,
  };
}

/**
 * Payment analytics for admin dashboard
 */
export function usePaymentAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: [...paymentKeys.all, 'analytics', period],
    queryFn: async () => {
      // TODO: Implement payment analytics when service is available
      return {
        revenue: {
          current: 0,
          previous: 0,
          change: 0,
        },
        volume: {
          current: 0,
          previous: 0,
          change: 0,
        },
        conversionRate: 0,
        averageValue: 0,
        failureRate: 0,
        topMethods: [] as Array<{ method: string; count: number; amount: number }>,
        trendData: [] as Array<{ date: string; amount: number; count: number }>,
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Payment notifications hook
 */
export function usePaymentNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...paymentKeys.all, 'notifications', user?.id || ''],
    queryFn: async () => {
      // TODO: Implement payment notifications
      return [] as Array<{
        id: string;
        type: 'success' | 'failure' | 'pending';
        paymentId: string;
        message: string;
        timestamp: Date;
        read: boolean;
      }>;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30000, // Poll for notifications
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Vipps integration helper hooks
 */
export function useVippsPayment() {
  const queryClient = useQueryClient();
  
  const initiateVippsPayment = useMutation({
    mutationFn: async (): Promise<VippsPaymentResponse> => {
      // TODO: Implement Vipps payment initiation
      throw new Error('Vipps payment not yet implemented with Prisma');
    },
    onSuccess: (vippsResponse: VippsPaymentResponse) => {
      // Start tracking the payment
      if (vippsResponse?.paymentId) {
        queryClient.invalidateQueries({ 
          queryKey: paymentKeys.tracking(vippsResponse.paymentId) 
        });
      }
    },
    throwOnError: false,
  });
  
  const checkVippsStatus = useMutation({
    mutationFn: async () => {
      // TODO: Implement Vipps status check
      throw new Error('Vipps status check not yet implemented');
    },
    throwOnError: false,
  });
  
  return {
    initiateVippsPayment,
    checkVippsStatus,
  };
}

/**
 * Payment discount management
 */
export function usePaymentDiscounts() {
  return useQuery({
    queryKey: ['payment-discounts'],
    queryFn: async () => {
      // TODO: Implement discount fetching
      return [] as Array<{
        id: string;
        code: string;
        percentage: number;
        validUntil: Date;
        usageLimit: number;
        used: number;
      }>;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Apply discount mutation
 */
export function useApplyDiscount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // TODO: Implement discount application
      throw new Error('Discount application not yet implemented');
    },
    onSuccess: () => {
      // Invalidate payment data to show updated discount
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
    throwOnError: false,
  });
}