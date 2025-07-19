import { NextRequest, NextResponse } from 'next/server';
import { checkVippsPaymentStatus, updatePaymentStatus, captureVippsPayment, verifyWebhookSignature, pollPaymentStatus } from '@/services/vipps-service';
import crypto from 'crypto';

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
    await updatePaymentStatus(orderId, paymentStatus);

    // Redirect based on payment status
    if (paymentStatus.state === 'AUTHORIZED') {
      // Payment is authorized, capture it
      try {
        await captureVippsPayment(orderId);
        return NextResponse.redirect(new URL(`/dashboard?payment=success&orderId=${orderId}`, request.url));
      } catch (error) {
        console.error('Error capturing payment:', error);
        return NextResponse.redirect(new URL('/dashboard?payment=error&reason=capture_failed', request.url));
      }
    } else if (paymentStatus.state === 'ABORTED' || paymentStatus.state === 'EXPIRED') {
      return NextResponse.redirect(new URL('/dashboard?payment=cancelled', request.url));
    } else if (paymentStatus.state === 'CREATED') {
      // Payment still pending, try polling fallback
      const finalStatus = await pollPaymentStatus(orderId, 3, 2000);
      if (finalStatus?.state === 'AUTHORIZED') {
        try {
          await captureVippsPayment(orderId);
          return NextResponse.redirect(new URL(`/dashboard?payment=success&orderId=${orderId}`, request.url));
        } catch (error) {
          console.error('Error capturing payment after polling:', error);
          return NextResponse.redirect(new URL('/dashboard?payment=error&reason=capture_failed', request.url));
        }
      } else {
        return NextResponse.redirect(new URL('/dashboard?payment=pending', request.url));
      }
    } else {
      return NextResponse.redirect(new URL('/dashboard?payment=error&reason=unknown_status', request.url));
    }
  } catch (error) {
    console.error('Error processing Vipps callback:', error);
    return NextResponse.redirect(new URL('/dashboard?payment=error&reason=processing_error', request.url));
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

    // If payment is authorized, capture it
    if (paymentStatus.state === 'AUTHORIZED' && payment.status === 'PROCESSING') {
      try {
        await captureVippsPayment(reference);
      } catch (error) {
        console.error('Error capturing payment from webhook:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Vipps webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}