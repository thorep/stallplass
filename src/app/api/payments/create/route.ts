import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';
import { createVippsPayment } from '@/services/vipps-service';
import { getBasePrice, getDiscountForMonths } from '@/services/pricing-service';
import { supabaseServer } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  let stableId: string | undefined;
  let months: number | undefined;
  let decodedToken: { uid: string } | null = null;
  
  try {
    // Verify Firebase authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    stableId = body.stableId;
    months = body.months || 1;

    if (!stableId) {
      return NextResponse.json({ error: 'Stable ID is required' }, { status: 400 });
    }

    if (!months || months < 1 || months > 12) {
      return NextResponse.json({ error: 'Invalid number of months' }, { status: 400 });
    }

    // Get stable information
    const { data: stable, error: stableError } = await supabaseServer
      .from('stables')
      .select(`
        *,
        boxes (*)
      `)
      .eq('id', stableId)
      .single();

    if (stableError) {
      console.error('Error fetching stable:', stableError);
      return NextResponse.json({ error: 'Error fetching stable information' }, { status: 500 });
    }

    if (!stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    // Calculate payment amount
    const basePrice = await getBasePrice();
    const numberOfBoxes = stable.boxes.length;
    
    // Validate that there are boxes to advertise
    if (numberOfBoxes === 0) {
      return NextResponse.json({ 
        error: 'Ingen bokser å annonsere. Du må ha minst én aktiv boks for å starte annonsering.' 
      }, { status: 400 });
    }
    
    const monthlyAmount = basePrice * numberOfBoxes * 100; // Convert to øre
    const totalAmountBeforeDiscount = monthlyAmount * months;
    
    // Get discount
    const discount = await getDiscountForMonths(months);
    const totalAmount = Math.round(totalAmountBeforeDiscount * (1 - discount));
    
    // Extra validation to ensure amount is valid
    if (totalAmount <= 0) {
      console.error('Invalid amount calculated:', {
        basePrice,
        numberOfBoxes,
        monthlyAmount,
        totalAmountBeforeDiscount,
        discount,
        totalAmount
      });
      return NextResponse.json({ 
        error: 'Ugyldig beløp beregnet. Vennligst kontakt support.' 
      }, { status: 400 });
    }

    // Create payment description
    const description = `Betaling for ${numberOfBoxes} boks${numberOfBoxes > 1 ? 'er' : ''} hos ${stable.name} - ${months} måned${months > 1 ? 'er' : ''}`;

    // Create Vipps payment
    const payment = await createVippsPayment(
      userId,
      stableId,
      totalAmountBeforeDiscount,
      months,
      discount,
      description
    );
    
    // Broadcast payment creation
    await broadcastPaymentUpdate(payment, 'payment_created');

    // Get the redirect URL from the payment metadata
    const redirectUrl = payment.metadata ? (payment.metadata as Record<string, unknown>).redirectUrl : null;

    if (!redirectUrl) {
      throw new Error('No redirect URL received from Vipps');
    }

    // Broadcast payment initiation
    await broadcastPaymentUpdate({
      ...payment,
      status: 'PENDING'
    }, 'payment_initiated');
    
    return NextResponse.json({
      paymentId: payment.id,
      vippsOrderId: payment.vipps_order_id,
      redirectUrl,
      amount: totalAmount,
      description,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log more details for debugging
    console.error('Payment creation failed:', {
      error: errorMessage,
      stableId,
      months,
      userId: decodedToken?.uid
    });
    
    // Broadcast payment creation failure
    if (decodedToken?.uid && stableId) {
      await broadcastPaymentUpdate({
        id: 'unknown',
        user_id: decodedToken.uid,
        stable_id: stableId,
        status: 'FAILED',
        failure_reason: errorMessage,
        total_amount: 0,
        vipps_order_id: 'failed'
      } as any, 'payment_creation_failed');
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to broadcast payment updates via Supabase real-time
async function broadcastPaymentUpdate(payment: any, eventType: string) {
  try {
    // Create a broadcast message for real-time updates
    const broadcastPayload = {
      type: 'payment_update',
      event_type: eventType,
      payment_id: payment.id,
      vipps_order_id: payment.vipps_order_id,
      status: payment.status,
      amount: payment.total_amount || payment.amount || 0,
      user_id: payment.user_id,
      stable_id: payment.stable_id,
      failure_reason: payment.failure_reason,
      timestamp: new Date().toISOString(),
      metadata: {
        event_type: eventType,
        source: 'payment_creation_api'
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