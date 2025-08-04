import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { getAdminProfilesWithCounts } from '@/services/admin-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const profiles = await getAdminProfilesWithCounts();
    return NextResponse.json(profiles);
  } catch (error) {
    logger.error('Failed to fetch admin profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}