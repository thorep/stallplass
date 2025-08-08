import { NextRequest, NextResponse } from 'next/server';
import { getProfileInvoiceRequests } from '@/services/invoice-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { createApiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's own invoice requests
    const invoiceRequests = await getProfileInvoiceRequests(auth.uid);
    return NextResponse.json({ invoiceRequests });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/invoice-requests/profile',
      method: 'GET',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to fetch profile invoice requests');
    
    return NextResponse.json(
      { error: 'Failed to fetch profile invoice requests' },
      { status: 500 }
    );
  }
}