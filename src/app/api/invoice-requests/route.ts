import { NextRequest, NextResponse } from 'next/server';
import { getAllInvoiceRequests, getUserInvoiceRequests } from '@/services/invoice-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin') === 'true';

    if (admin) {
      // Check if user is admin using Prisma
      const user = await prisma.users.findUnique({
        where: { id: auth.uid },
        select: { isAdmin: true }
      });

      if (!user?.isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      
      const invoiceRequests = await getAllInvoiceRequests();
      return NextResponse.json({ invoiceRequests });
    } else {
      // Get user's own invoice requests
      const invoiceRequests = await getUserInvoiceRequests(auth.uid);
      return NextResponse.json({ invoiceRequests });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch invoice requests' },
      { status: 500 }
    );
  }
}