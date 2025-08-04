import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { cleanupExpiredContent, getExpiringBoxes, getExpiringServices, getExpiringSponsoredPlacements } from '@/services/cleanup-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const results = await cleanupExpiredContent();

    return NextResponse.json({
      success: true,
      message: 'Manual cleanup completed successfully',
      results
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup',
      method: 'POST',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Admin cleanup failed');
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const expiringBoxes = await getExpiringBoxes(7);
    const expiringServices = await getExpiringServices(7);
    const expiringSponsoredPlacements = await getExpiringSponsoredPlacements(3);

    return NextResponse.json({
      expiringBoxes,
      expiringServices,
      expiringSponsoredPlacements,
      summary: {
        boxesExpiring7Days: expiringBoxes.length,
        servicesExpiring7Days: expiringServices.length,
        sponsoredExpiring3Days: expiringSponsoredPlacements.length
      }
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup',
      method: 'GET',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to get expiring content');
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}