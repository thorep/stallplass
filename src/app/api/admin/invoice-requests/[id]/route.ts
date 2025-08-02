import { NextRequest, NextResponse } from 'next/server';
import { updateInvoiceRequestStatus } from '@/services/invoice-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const profile = await prisma.profiles.findUnique({
      where: { id: auth.uid },
      select: { isAdmin: true }
    });

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
}