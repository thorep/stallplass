import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const decodedToken = await authenticateRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const { stableId, months = 1 } = body;

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

    // Validate that there are boxes to advertise
    if (stable.boxes.length === 0) {
      return NextResponse.json({ 
        error: 'Ingen bokser å annonsere. Du må ha minst én boks for å starte annonsering.' 
      }, { status: 400 });
    }

    // Create bypass payment record
    const bypassOrderId = `bypass-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: payment, error: paymentError } = await supabaseServer
      .from('payments')
      .insert({
        user_id: userId,
        firebase_id: userId,
        stable_id: stableId,
        amount: 0, // Bypass payment - no actual cost
        months,
        discount: 1.0, // 100% discount for bypass
        total_amount: 0,
        vipps_order_id: bypassOrderId,
        status: 'COMPLETED',
        payment_method: 'BYPASS',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json({ error: 'Error creating payment record' }, { status: 500 });
    }

    // Update stable advertising period
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);
    
    const { error: stableUpdateError } = await supabaseServer
      .from('stables')
      .update({
        advertising_start_date: now.toISOString(),
        advertising_end_date: endDate.toISOString(),
        advertising_active: true,
      })
      .eq('id', stableId);

    if (stableUpdateError) {
      console.error('Error updating stable:', stableUpdateError);
      return NextResponse.json({ error: 'Error updating stable advertising' }, { status: 500 });
    }

    // Activate all boxes in the stable
    const { error: boxUpdateError } = await supabaseServer
      .from('boxes')
      .update({
        is_active: true,
      })
      .eq('stable_id', stableId);

    if (boxUpdateError) {
      console.error('Error updating boxes:', boxUpdateError);
      return NextResponse.json({ error: 'Error activating boxes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Advertising activated successfully via bypass',
      advertisingUntil: endDate.toISOString(),
    });
  } catch (error) {
    console.error('Error processing bypass payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}