import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

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
    const { stableId, months = 1 } = body;

    if (!stableId) {
      return NextResponse.json({ error: 'Stable ID is required' }, { status: 400 });
    }

    if (!months || months < 1 || months > 12) {
      return NextResponse.json({ error: 'Invalid number of months' }, { status: 400 });
    }

    // Get stable information
    const stable = await prisma.stable.findUnique({
      where: { id: stableId },
      include: {
        boxes: true,
      },
    });

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
    
    const payment = await prisma.payment.create({
      data: {
        userId,
        firebaseId: userId,
        stableId,
        amount: 0, // Bypass payment - no actual cost
        months,
        discount: 1.0, // 100% discount for bypass
        totalAmount: 0,
        vippsOrderId: bypassOrderId,
        status: 'COMPLETED',
        paymentMethod: 'BYPASS',
        paidAt: new Date(),
      },
    });

    // Update stable advertising period
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);
    
    await prisma.stable.update({
      where: { id: stableId },
      data: {
        advertisingStartDate: now,
        advertisingEndDate: endDate,
        advertisingActive: true,
      },
    });

    // Activate all boxes in the stable
    await prisma.box.updateMany({
      where: { stableId },
      data: {
        isActive: true,
      },
    });

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