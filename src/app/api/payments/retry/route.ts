import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { createVippsPayment } from '@/services/vipps-service';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Get the failed payment
    const { data: failedPayment, error: paymentError } = await supabaseServer
      .from('payments')
      .select(`
        *,
        stable:stables(
          *,
          boxes (*)
        )
      `)
      .eq('id', paymentId)
      .eq('user_id', userId) // Ensure user owns this payment
      .single();

    if (paymentError || !failedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (failedPayment.status !== 'FAILED' && failedPayment.status !== 'CANCELLED') {
      return NextResponse.json({ 
        error: 'Only failed or cancelled payments can be retried' 
      }, { status: 400 });
    }

    // Create description for retry
    const numberOfBoxes = failedPayment.stable?.boxes?.length || 0;
    const description = `Ny betaling for ${numberOfBoxes} boks${numberOfBoxes > 1 ? 'er' : ''} hos ${failedPayment.stable?.name} - ${failedPayment.months} måned${failedPayment.months > 1 ? 'er' : ''}`;

    // Create new Vipps payment
    const newPayment = await createVippsPayment(
      userId,
      failedPayment.stable_id,
      failedPayment.amount,
      failedPayment.months,
      failedPayment.discount,
      description
    );

    // Mark old payment as superseded
    await supabaseServer
      .from('payments')
      .update({
        status: 'CANCELLED',
        failure_reason: 'Superseded by retry',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    // Get the redirect URL from the payment metadata
    const redirectUrl = newPayment.metadata ? (newPayment.metadata as Record<string, unknown>).redirectUrl : null;

    if (!redirectUrl) {
      throw new Error('No redirect URL received from Vipps');
    }

    return NextResponse.json({
      paymentId: newPayment.id,
      vippsOrderId: newPayment.vipps_order_id,
      redirectUrl,
      amount: newPayment.total_amount,
      description,
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}