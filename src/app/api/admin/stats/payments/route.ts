import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { getPaymentStats } from '@/services/admin-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request);
    
    const stats = await getPaymentStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching payment statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}