import { NextRequest, NextResponse } from 'next/server';
import { checkVippsPaymentStatus, updatePaymentStatus } from '@/services/vipps-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vippsOrderId } = body;

    if (!vippsOrderId) {
      return NextResponse.json({ error: 'Vipps order ID is required' }, { status: 400 });
    }

    // Check payment status from Vipps
    const vippsStatus = await checkVippsPaymentStatus(vippsOrderId);
    
    // Update payment status in our database
    const payment = await updatePaymentStatus(vippsOrderId, vippsStatus);

    return NextResponse.json({
      payment,
      vippsStatus,
      success: true
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}