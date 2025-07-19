import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { cleanupExpiredContent, getExpiringStables, getExpiringSponsoredPlacements } from '@/services/cleanup-service';

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
    console.error('Manual cleanup failed:', error);
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

    const expiringStables = await getExpiringStables(7);
    const expiringSponsoredPlacements = await getExpiringSponsoredPlacements(3);

    return NextResponse.json({
      expiringStables,
      expiringSponsoredPlacements,
      summary: {
        stablesExpiring7Days: expiringStables.length,
        sponsoredExpiring3Days: expiringSponsoredPlacements.length
      }
    });
  } catch (error) {
    console.error('Failed to fetch expiring content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}