import { NextRequest, NextResponse } from 'next/server';
import { checkVippsPaymentStatus, updatePaymentStatus, captureVippsPayment } from '@/services/vipps-service';

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
    const body = await request.json();
    
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