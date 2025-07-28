import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceRequest, type CreateInvoiceRequestData } from '@/services/invoice-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<CreateInvoiceRequestData, 'userId'> = await request.json();
    
    // Validate required fields
    const required = ['fullName', 'address', 'postalCode', 'city', 'phone', 'email', 'amount', 'totalAmount', 'description', 'itemType'];
    for (const field of required) {
      if (!body[field as keyof typeof body]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const invoiceRequest = await createInvoiceRequest({
      ...body,
      userId: auth.uid
    });

    return NextResponse.json({ 
      invoiceRequest,
      message: 'Invoice request created successfully. Your purchase has been activated and you will receive an invoice by email.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice request' },
      { status: 500 }
    );
  }
}