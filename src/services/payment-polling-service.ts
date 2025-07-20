import { supabase } from '@/lib/supabase';
import { checkVippsPaymentStatus, updatePaymentStatus } from './vipps-service';
import { Tables } from '@/types/supabase';

type Payment = Tables<'payments'>;

export interface PollingConfig {
  intervalMs: number;
  maxAttempts: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
  enableRealTimeBroadcast: boolean;
}

export interface PollingSession {
  id: string;
  paymentId: string;
  vippsOrderId: string;
  startTime: Date;
  attempts: number;
  lastAttempt: Date | null;
  nextAttempt: Date | null;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  finalStatus?: string;
  error?: string;
}

class PaymentPollingService {
  private activeSessions = new Map<string, PollingSession>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private defaultConfig: PollingConfig = {
    intervalMs: 3000,
    maxAttempts: 20,
    backoffMultiplier: 1.2,
    maxBackoffMs: 30000,
    enableRealTimeBroadcast: true
  };

  /**
   * Start polling a payment for status updates
   */
  startPolling(
    paymentId: string,
    vippsOrderId: string,
    config: Partial<PollingConfig> = {}
  ): string {
    const sessionId = `poll_${paymentId}_${Date.now()}`;
    const finalConfig = { ...this.defaultConfig, ...config };

    const session: PollingSession = {
      id: sessionId,
      paymentId,
      vippsOrderId,
      startTime: new Date(),
      attempts: 0,
      lastAttempt: null,
      nextAttempt: new Date(Date.now() + finalConfig.intervalMs),
      status: 'active'
    };

    this.activeSessions.set(sessionId, session);
    this.scheduleNextPoll(sessionId, finalConfig);

    console.log(`Started polling session ${sessionId} for payment ${paymentId}`);
    return sessionId;
  }

  /**
   * Stop polling a specific session
   */
  stopPolling(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Clear timeout
    const timeout = this.timeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(sessionId);
    }

    // Update session status
    session.status = 'cancelled';
    this.activeSessions.set(sessionId, session);

    console.log(`Stopped polling session ${sessionId}`);
    return true;
  }

  /**
   * Get all active polling sessions
   */
  getActiveSessions(): PollingSession[] {
    return Array.from(this.activeSessions.values()).filter(s => s.status === 'active');
  }

  /**
   * Get a specific polling session
   */
  getSession(sessionId: string): PollingSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Stop all active polling sessions
   */
  stopAllPolling(): void {
    for (const sessionId of this.activeSessions.keys()) {
      this.stopPolling(sessionId);
    }
  }

  /**
   * Get statistics about polling performance
   */
  getPollingStats() {
    const sessions = Array.from(this.activeSessions.values());
    const activeSessions = sessions.filter(s => s.status === 'active');
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const failedSessions = sessions.filter(s => s.status === 'failed');

    const averageAttempts = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.attempts, 0) / completedSessions.length
      : 0;

    const averageDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => {
          const duration = s.lastAttempt 
            ? s.lastAttempt.getTime() - s.startTime.getTime()
            : 0;
          return sum + duration;
        }, 0) / completedSessions.length
      : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      completedSessions: completedSessions.length,
      failedSessions: failedSessions.length,
      successRate: sessions.length > 0 
        ? (completedSessions.length / (completedSessions.length + failedSessions.length)) * 100 
        : 0,
      averageAttempts: Math.round(averageAttempts * 10) / 10,
      averageDurationMs: Math.round(averageDuration),
      lastUpdated: new Date()
    };
  }

  private scheduleNextPoll(sessionId: string, config: PollingConfig): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') return;

    // Calculate next interval with exponential backoff
    const baseInterval = config.intervalMs;
    const backoffInterval = Math.min(
      baseInterval * Math.pow(config.backoffMultiplier, session.attempts),
      config.maxBackoffMs
    );

    const timeout = setTimeout(async () => {
      await this.performPoll(sessionId, config);
    }, backoffInterval);

    this.timeouts.set(sessionId, timeout);

    // Update next attempt time
    session.nextAttempt = new Date(Date.now() + backoffInterval);
    this.activeSessions.set(sessionId, session);
  }

  private async performPoll(sessionId: string, config: PollingConfig): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') return;

    session.attempts++;
    session.lastAttempt = new Date();
    this.activeSessions.set(sessionId, session);

    try {
      console.log(`Polling attempt ${session.attempts} for session ${sessionId}`);

      // Check payment status from Vipps
      const vippsStatus = await checkVippsPaymentStatus(session.vippsOrderId);
      
      // Update payment in database
      const updatedPayment = await updatePaymentStatus(session.vippsOrderId, vippsStatus);

      // Broadcast real-time update
      if (config.enableRealTimeBroadcast) {
        await this.broadcastPollingUpdate(session, updatedPayment, vippsStatus);
      }

      // Check if payment is in final state
      const finalStates = ['AUTHORIZED', 'ABORTED', 'EXPIRED', 'TERMINATED'];
      if (finalStates.includes(vippsStatus.state)) {
        session.status = 'completed';
        session.finalStatus = vippsStatus.state;
        this.activeSessions.set(sessionId, session);

        console.log(`Polling completed for session ${sessionId} with status ${vippsStatus.state}`);
        return;
      }

      // Check if we've reached max attempts
      if (session.attempts >= config.maxAttempts) {
        session.status = 'failed';
        session.error = 'Max polling attempts reached';
        this.activeSessions.set(sessionId, session);

        console.log(`Polling failed for session ${sessionId} - max attempts reached`);
        return;
      }

      // Schedule next poll
      this.scheduleNextPoll(sessionId, config);

    } catch (error) {
      console.error(`Polling error for session ${sessionId}:`, error);

      session.error = error instanceof Error ? error.message : 'Unknown error';

      // If we've reached max attempts or it's a critical error, stop polling
      if (session.attempts >= config.maxAttempts || this.isCriticalError(error)) {
        session.status = 'failed';
        this.activeSessions.set(sessionId, session);
        return;
      }

      // Schedule retry
      this.scheduleNextPoll(sessionId, config);
    }
  }

  private async broadcastPollingUpdate(
    session: PollingSession,
    payment: Payment,
    vippsStatus: any
  ): Promise<void> {
    try {
      const broadcastPayload = {
        type: 'payment_polling_update',
        session_id: session.id,
        payment_id: session.paymentId,
        vipps_order_id: session.vippsOrderId,
        polling_attempt: session.attempts,
        vipps_status: vippsStatus.state,
        payment_status: payment.status,
        amount: payment.total_amount,
        user_id: payment.user_id,
        stable_id: payment.stable_id,
        timestamp: new Date().toISOString(),
        metadata: {
          polling_session: session.id,
          attempts: session.attempts,
          source: 'payment_polling_service'
        }
      };

      // Broadcast to all listening clients
      const channel = supabase.channel('payment_polling_updates');
      await channel.send({
        type: 'broadcast',
        event: 'payment_polling_status',
        payload: broadcastPayload
      });

    } catch (error) {
      console.error('Error broadcasting polling update:', error);
      // Don't throw - broadcasting is not critical
    }
  }

  private isCriticalError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Critical errors that shouldn't be retried
    const criticalPatterns = [
      'payment not found',
      'invalid order id',
      'unauthorized',
      'forbidden',
      'payment already processed'
    ];

    return criticalPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Clean up old completed/failed sessions to prevent memory leaks
   */
  cleanup(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.status !== 'active' && session.startTime < cutoffTime) {
        this.activeSessions.delete(sessionId);
        
        // Clear any remaining timeouts
        const timeout = this.timeouts.get(sessionId);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(sessionId);
        }
      }
    }
  }
}

// Create singleton instance
export const paymentPollingService = new PaymentPollingService();

// Utility functions for easy access
export const startPaymentPolling = (
  paymentId: string,
  vippsOrderId: string,
  config?: Partial<PollingConfig>
): string => {
  return paymentPollingService.startPolling(paymentId, vippsOrderId, config);
};

export const stopPaymentPolling = (sessionId: string): boolean => {
  return paymentPollingService.stopPolling(sessionId);
};

export const getPollingSession = (sessionId: string): PollingSession | null => {
  return paymentPollingService.getSession(sessionId);
};

export const getActivePollingSessions = (): PollingSession[] => {
  return paymentPollingService.getActiveSessions();
};

export const getPollingStats = () => {
  return paymentPollingService.getPollingStats();
};

// Cleanup function to be called periodically
export const cleanupOldPollingSessions = (maxAgeHours?: number): void => {
  paymentPollingService.cleanup(maxAgeHours);
};

// Auto-cleanup every hour
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    cleanupOldPollingSessions();
  }, 60 * 60 * 1000); // 1 hour
}