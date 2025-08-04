import { NextRequest, NextResponse } from 'next/server';
import { updateInvoiceRequestStatus } from '@/services/invoice-service';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';

export const PATCH = withAdminAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {

    const { status, adminNotes, invoiceNumber } = await request.json();
    const { id } = await params;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatedRequest = await updateInvoiceRequestStatus(
      id,
      status,
      adminNotes,
      invoiceNumber
    );

    return NextResponse.json({ invoiceRequest: updatedRequest });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update invoice request' },
      { status: 500 }
    );
  }
});