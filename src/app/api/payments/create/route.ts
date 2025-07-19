import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { createVippsPayment } from '@/services/vipps-service';
import { getBasePrice, getDiscountForMonths } from '@/services/pricing-service';
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

    if (months < 1 || months > 12) {
      return NextResponse.json({ error: 'Invalid number of months' }, { status: 400 });
    }

    // Get stable information
    const stable = await prisma.stable.findUnique({
      where: { id: stableId },
      include: {
        boxes: {
          where: { isActive: true },
        },
      },
    });

    if (!stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    // Calculate payment amount
    const basePrice = await getBasePrice();
    const numberOfBoxes = stable.boxes.length;
    const monthlyAmount = basePrice * numberOfBoxes * 100; // Convert to øre
    const totalAmountBeforeDiscount = monthlyAmount * months;
    
    // Get discount
    const discount = await getDiscountForMonths(months);
    const totalAmount = Math.round(totalAmountBeforeDiscount * (1 - discount));

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

    // Get the redirect URL from the payment metadata
    const redirectUrl = payment.metadata ? (payment.metadata as Record<string, unknown>).redirectUrl : null;

    if (!redirectUrl) {
      throw new Error('No redirect URL received from Vipps');
    }

    return NextResponse.json({
      paymentId: payment.id,
      vippsOrderId: payment.vippsOrderId,
      redirectUrl,
      amount: totalAmount,
      description,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}