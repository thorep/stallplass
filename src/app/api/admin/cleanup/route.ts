import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { cleanupExpiredContent, getExpiringBoxes, getExpiringServices, getExpiringSponsoredPlacements } from '@/services/cleanup-service';

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
  } catch {
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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}