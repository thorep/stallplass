import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { getBoxStats } from '@/services/admin-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request);
    
    const stats = await getBoxStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching box statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box statistics' },
      { status: 500 }
    );
  }
}