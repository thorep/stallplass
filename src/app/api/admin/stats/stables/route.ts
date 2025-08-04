import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { getStableStats } from '@/services/admin-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request);
    
    const stats = await getStableStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching stable statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stable statistics' },
      { status: 500 }
    );
  }
}