import { NextRequest, NextResponse } from 'next/server';
import { getAllInvoiceRequests, getProfileInvoiceRequests, type InvoiceRequestFilters } from '@/services/invoice-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';
import { type InvoiceRequestStatus } from '@/generated/prisma';
import { logger, createApiLogger } from '@/lib/logger';

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
      const profile = await prisma.profiles.findUnique({
        where: { id: auth.uid },
        select: { isAdmin: true }
      });

      if (!profile?.isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      
      // Parse filtering, sorting, and pagination parameters
      const filters: InvoiceRequestFilters = {
        status: searchParams.get('status') as InvoiceRequestStatus || undefined,
        sortBy: (searchParams.get('sortBy') as 'createdAt' | 'amount' | 'fullName' | 'status') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
        pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20
      };

      // Validate status filter if provided
      const validStatuses: InvoiceRequestStatus[] = ['PENDING', 'INVOICE_SENT', 'PAID', 'CANCELLED'];
      if (filters.status && !validStatuses.includes(filters.status)) {
        return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
      }

      const result = await getAllInvoiceRequests(filters);
      return NextResponse.json(result);
    } else {
      // Get user's own invoice requests
      const invoiceRequests = await getProfileInvoiceRequests(auth.uid);
      return NextResponse.json({ invoiceRequests });
    }
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/invoice-requests',
      method: 'GET',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to fetch invoice requests');
    
    return NextResponse.json(
      { error: 'Failed to fetch invoice requests' },
      { status: 500 }
    );
  }
}