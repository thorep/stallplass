import { NextRequest, NextResponse } from 'next/server';
import { updateInvoiceRequestStatus } from '@/services/invoice-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

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
    const { data: user } = await supabaseServer
      .from('users')
      .select('isAdmin')
      .eq('id', auth.uid)
      .single();

    if (!user?.isAdmin) {
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