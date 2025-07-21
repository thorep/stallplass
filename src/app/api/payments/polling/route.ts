import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';
import {
  startPaymentPolling,
  stopPaymentPolling,
  getPollingSession,
  getActivePollingSessions,
  getPollingStats,
  cleanupOldPollingSessions,
  PollingConfig
} from '@/services/payment-polling-service';
import { supabaseServer } from '@/lib/supabase-server';

// GET: Get polling status or statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action');

    // Handle different GET actions
    switch (action) {
      case 'stats':
        return NextResponse.json({
          stats: getPollingStats(),
          activeSessions: getActivePollingSessions(),
          success: true
        });

      case 'session':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }
        
        const session = getPollingSession(sessionId);
        if (!session) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json({
          session,
          success: true
        });

      case 'active':
        return NextResponse.json({
          sessions: getActivePollingSessions(),
          success: true
        });

      default:
        return NextResponse.json({
          stats: getPollingStats(),
          success: true
        });
    }
  } catch (error) {
    console.error('Error getting polling status:', error);
    return NextResponse.json(
      { error: 'Failed to get polling status' },
      { status: 500 }
    );
  }
}

// POST: Start polling, stop polling, or perform actions
export async function POST(request: NextRequest) {
  try {
    // Verify authentication for most actions
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken?.uid || null;

    const body = await request.json();
    const { action, paymentId, sessionId, vippsOrderId, config } = body;

    switch (action) {
      case 'start':
        if (!paymentId || !vippsOrderId) {
          return NextResponse.json({ 
            error: 'Payment ID and Vipps Order ID are required' 
          }, { status: 400 });
        }

        // Verify user owns this payment if userId is provided
        if (userId) {
          const { data: payment, error } = await supabaseServer
            .from('betalinger')
            .select('id, bruker_id')
            .eq('id', paymentId)
            .eq('bruker_id', userId)
            .single();

          if (error || !payment) {
            return NextResponse.json({ error: 'Payment not found or access denied' }, { status: 404 });
          }
        }

        // Parse polling configuration
        const pollingConfig: Partial<PollingConfig> = {
          intervalMs: config?.intervalMs || 3000,
          maxAttempts: Math.min(config?.maxAttempts || 20, 50), // Cap at 50 attempts
          backoffMultiplier: Math.min(config?.backoffMultiplier || 1.2, 2.0), // Cap at 2.0
          maxBackoffMs: Math.min(config?.maxBackoffMs || 30000, 60000), // Cap at 1 minute
          enableRealTimeBroadcast: config?.enableRealTimeBroadcast !== false
        };

        const newSessionId = startPaymentPolling(paymentId, vippsOrderId, pollingConfig);

        return NextResponse.json({
          sessionId: newSessionId,
          config: pollingConfig,
          success: true
        });

      case 'stop':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const stopped = stopPaymentPolling(sessionId);
        
        return NextResponse.json({
          stopped,
          sessionId,
          success: true
        });

      case 'cleanup':
        // Only allow admins to trigger cleanup
        if (!decodedToken) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const maxAgeHours = Math.min(body.maxAgeHours || 24, 168); // Cap at 1 week
        cleanupOldPollingSessions(maxAgeHours);

        return NextResponse.json({
          message: `Cleaned up sessions older than ${maxAgeHours} hours`,
          success: true
        });

      case 'restart':
        if (!sessionId || !paymentId || !vippsOrderId) {
          return NextResponse.json({ 
            error: 'Session ID, Payment ID, and Vipps Order ID are required' 
          }, { status: 400 });
        }

        // Stop existing session
        stopPaymentPolling(sessionId);

        // Start new session
        const restartConfig: Partial<PollingConfig> = {
          intervalMs: config?.intervalMs || 3000,
          maxAttempts: Math.min(config?.maxAttempts || 20, 50),
          backoffMultiplier: Math.min(config?.backoffMultiplier || 1.2, 2.0),
          maxBackoffMs: Math.min(config?.maxBackoffMs || 30000, 60000),
          enableRealTimeBroadcast: config?.enableRealTimeBroadcast !== false
        };

        const restartSessionId = startPaymentPolling(paymentId, vippsOrderId, restartConfig);

        return NextResponse.json({
          oldSessionId: sessionId,
          newSessionId: restartSessionId,
          config: restartConfig,
          success: true
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: start, stop, cleanup, or restart' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling polling request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE: Stop all polling or cleanup
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication for delete operations
    const decodedToken = await authenticateRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'all':
        // Stop all active polling sessions
        const activeSessions = getActivePollingSessions();
        const stoppedCount = activeSessions.length;
        
        activeSessions.forEach(session => {
          stopPaymentPolling(session.id);
        });

        return NextResponse.json({
          message: `Stopped ${stoppedCount} active polling sessions`,
          stoppedSessions: stoppedCount,
          success: true
        });

      case 'cleanup':
        // Clean up old sessions
        const maxAgeHours = Math.min(
          parseInt(searchParams.get('maxAgeHours') || '24'),
          168
        );
        
        cleanupOldPollingSessions(maxAgeHours);

        return NextResponse.json({
          message: `Cleaned up sessions older than ${maxAgeHours} hours`,
          success: true
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: all or cleanup' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling delete request:', error);
    return NextResponse.json(
      { error: 'Failed to process delete request' },
      { status: 500 }
    );
  }
}