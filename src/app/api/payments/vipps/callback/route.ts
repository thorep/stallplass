import { NextRequest, NextResponse } from 'next/server';
import { checkVippsPaymentStatus, updatePaymentStatus, captureVippsPayment, verifyWebhookSignature, pollPaymentStatus } from '@/services/vipps-service';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.redirect(new URL('/dashboard?payment=error&reason=missing_order', request.url));
    }

    // Check payment status from Vipps
    const paymentStatus = await checkVippsPaymentStatus(orderId);
    
    // Update payment status in our database
    const updatedPayment = await updatePaymentStatus(orderId, paymentStatus);
    
    // Broadcast real-time update
    await broadcastPaymentUpdate(updatedPayment, 'callback_status_check');

    // Redirect based on payment status
    if (paymentStatus.state === 'AUTHORIZED') {
      // Payment is authorized, capture it
      try {
        const capturedPayment = await captureVippsPayment(orderId);
        
        // Broadcast successful payment capture
        await broadcastPaymentUpdate(capturedPayment, 'payment_captured');
        
        return NextResponse.redirect(new URL(`/dashboard?payment=success&orderId=${orderId}`, request.url));
      } catch (error) {
        console.error('Error capturing payment:', error);
        
        // Broadcast capture failure
        if (updatedPayment) {
          await broadcastPaymentUpdate({
            ...updatedPayment,
            status: 'FAILED',
            failure_reason: 'Capture failed'
          }, 'capture_failed');
        }
        
        return NextResponse.redirect(new URL('/dashboard?payment=error&reason=capture_failed', request.url));
      }
    } else if (paymentStatus.state === 'ABORTED' || paymentStatus.state === 'EXPIRED') {
      return NextResponse.redirect(new URL('/dashboard?payment=cancelled', request.url));
    } else if (paymentStatus.state === 'CREATED') {
      // Payment still pending, try polling fallback
      const finalStatus = await pollPaymentStatus(orderId, 3, 2000);
      if (finalStatus?.state === 'AUTHORIZED') {
        try {
          const capturedPayment = await captureVippsPayment(orderId);
          
          // Broadcast successful payment capture after polling
          await broadcastPaymentUpdate(capturedPayment, 'payment_captured_after_polling');
          
          return NextResponse.redirect(new URL(`/dashboard?payment=success&orderId=${orderId}`, request.url));
        } catch (error) {
          console.error('Error capturing payment after polling:', error);
          
          // Broadcast capture failure after polling
          if (updatedPayment) {
            await broadcastPaymentUpdate({
              ...updatedPayment,
              status: 'FAILED',
              failure_reason: 'Capture failed after polling'
            }, 'capture_failed_after_polling');
          }
          
          return NextResponse.redirect(new URL('/dashboard?payment=error&reason=capture_failed', request.url));
        }
      } else {
        // Broadcast pending status after polling timeout
        if (updatedPayment) {
          await broadcastPaymentUpdate(updatedPayment, 'polling_timeout');
        }
        
        return NextResponse.redirect(new URL('/dashboard?payment=pending', request.url));
      }
    } else {
      return NextResponse.redirect(new URL('/dashboard?payment=error&reason=unknown_status', request.url));
    }
  } catch (error) {
    console.error('Error processing Vipps callback:', error);
    
    // Broadcast callback processing error
    await broadcastPaymentUpdate({
      id: 'unknown',
      vipps_order_id: orderId,
      status: 'FAILED',
      failure_reason: 'Callback processing error'
    } as Database['public']['Tables']['payments']['Row'], 'callback_error');
    
    return NextResponse.redirect(new URL('/dashboard?payment=error&reason=processing_error', request.url));
  }
}

// Helper function to broadcast payment updates via Supabase real-time
async function broadcastPaymentUpdate(payment: Database['public']['Tables']['payments']['Row'], eventType: string) {
  try {
    // Create a broadcast message for real-time updates
    const broadcastPayload = {
      type: 'payment_update',
      event_type: eventType,
      payment_id: payment.id,
      vipps_order_id: payment.vipps_order_id,
      status: payment.status,
      amount: payment.total_amount || payment.amount,
      user_id: payment.user_id,
      stable_id: payment.stable_id,
      failure_reason: payment.failure_reason,
      timestamp: new Date().toISOString(),
      metadata: {
        event_type: eventType,
        source: 'vipps_callback'
      }
    };

    // Broadcast to all listening clients
    const channel = supabase.channel('payment_updates');
    await channel.send({
      type: 'broadcast',
      event: 'payment_status_changed',
      payload: broadcastPayload
    });

    console.log('Payment update broadcasted:', {
      paymentId: payment.id,
      eventType,
      status: payment.status
    });
  } catch (error) {
    console.error('Error broadcasting payment update:', error);
    // Don't throw - broadcasting is not critical for payment processing
  }
}

// Webhook endpoint for Vipps notifications
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get required headers for signature verification
    const signature = request.headers.get('authorization');
    const timestamp = request.headers.get('x-ms-date');
    const contentSha256 = request.headers.get('x-ms-content-sha256');

    if (!signature || !timestamp || !contentSha256) {
      console.error('Missing required webhook headers');
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(rawBody, signature, timestamp, contentSha256);
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the body
    const body = JSON.parse(rawBody);
    
    // Vipps sends webhooks with the following structure
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    // Check payment status from Vipps
    const paymentStatus = await checkVippsPaymentStatus(reference);
    
    // Update payment status in our database
    const payment = await updatePaymentStatus(reference, paymentStatus);
    
    // Broadcast real-time update from webhook
    await broadcastPaymentUpdate(payment, 'webhook_update');

    // If payment is authorized, capture it
    if (paymentStatus.state === 'AUTHORIZED' && payment.status === 'PROCESSING') {
      try {
        const capturedPayment = await captureVippsPayment(reference);
        
        // Broadcast successful webhook capture
        await broadcastPaymentUpdate(capturedPayment, 'webhook_capture_success');
      } catch (error) {
        console.error('Error capturing payment from webhook:', error);
        
        // Broadcast webhook capture failure
        await broadcastPaymentUpdate({
          ...payment,
          status: 'FAILED',
          failure_reason: 'Webhook capture failed'
        }, 'webhook_capture_failed');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Vipps webhook:', error);
    
    // Broadcast webhook processing error
    await broadcastPaymentUpdate({
      id: 'unknown',
      vipps_order_id: reference || 'unknown',
      status: 'FAILED',
      failure_reason: 'Webhook processing error'
    } as Database['public']['Tables']['payments']['Row'], 'webhook_error');
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}