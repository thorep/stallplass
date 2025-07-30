import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceRequest } from '@/services/invoice-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { createApiLogger } from '@/lib/logger';
import { InvoiceItemType } from '@/generated/prisma';

export async function POST(request: NextRequest) {
  let auth: { uid: string } | null = null;
  let body: Record<string, unknown> | null = null;
  
  try {
    auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    body = await request.json();
    
    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }
    
    // Validate required fields
    const required = ['fullName', 'address', 'postalCode', 'city', 'phone', 'email', 'amount', 'description', 'itemType'];
    for (const field of required) {
      if (!body[field as keyof typeof body]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Ensure discount field is provided (default to 0 if not specified)
    const discount = typeof body.discount === 'number' ? body.discount : 0;

    // SECURITY: Validate pricing for BOX_ADVERTISING to prevent manipulation
    if (body.itemType === 'BOX_ADVERTISING' && body.boxId && body.months) {
      const { calculatePricingWithDiscounts } = await import('@/services/pricing-service');
      const boxIds = (body.boxId as string).split(',');
      const serverPricing = await calculatePricingWithDiscounts(boxIds.length, body.months as number);
      
      // Allow small rounding differences (up to 1 kr)
      if (Math.abs((body.amount as number) - serverPricing.finalPrice) > 1) {
        return NextResponse.json({ 
          error: 'Price validation failed. Please refresh the page and try again.',
          expected: serverPricing.finalPrice,
          received: body.amount
        }, { status: 400 });
      }
      
      // Use server-calculated pricing to be absolutely sure
      body.amount = serverPricing.finalPrice;
      body.discount = serverPricing.monthDiscount + serverPricing.boxQuantityDiscount;
    }

    const invoiceRequest = await createInvoiceRequest({
      userId: auth.uid,
      fullName: body.fullName as string,
      address: body.address as string,
      postalCode: body.postalCode as string,
      city: body.city as string,
      phone: body.phone as string,
      email: body.email as string,
      amount: body.amount as number,
      discount,
      description: body.description as string,
      itemType: body.itemType as InvoiceItemType,
      months: body.months as number | undefined,
      days: body.days as number | undefined,
      slots: body.slots as number | undefined,
      stableId: body.stableId as string | undefined,
      serviceId: body.serviceId as string | undefined,
      boxId: body.boxId as string | undefined,
    });

    return NextResponse.json({ 
      invoiceRequest,
      message: 'Invoice request created successfully. Your purchase has been activated and you will receive an invoice by email.'
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/invoice-requests/create',
      method: 'POST',
      userId: auth?.uid
    });
    
    apiLogger.error({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: body,
      userId: auth?.uid
    }, 'Failed to create invoice request');
    
    return NextResponse.json(
      { error: 'Failed to create invoice request' },
      { status: 500 }
    );
  }
}