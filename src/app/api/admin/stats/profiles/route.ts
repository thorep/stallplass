import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { getProfileStats } from '@/services/admin-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const stats = await getProfileStats();
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Failed to fetch profile stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile statistics' },
      { status: 500 }
    );
  }
}