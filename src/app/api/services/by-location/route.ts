import { NextRequest, NextResponse } from 'next/server';
import { getServicesForStable } from '@/services/marketplace-service';
import { logger } from '@/lib/logger';

/**
 * GET /api/services/by-location?countyId=<id>&municipalityId=<id>
 * 
 * Fetches services that cover a stable's location with hierarchical matching:
 * - Exact municipality match: Service covers "Vestfold->Sandefjord" → matches stable in "Vestfold->Sandefjord"
 * - County-wide coverage: Service covers "Telemark" → matches any stable in Telemark county
 * 
 * Query Parameters:
 * - countyId: Required. The county ID where the stable is located
 * - municipalityId: Optional. The municipality ID where the stable is located
 * 
 * Returns: Array of ServiceWithDetails objects that cover the stable's location
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countyId = searchParams.get('countyId');
    const municipalityId = searchParams.get('municipalityId');
    
    // Validate required parameters
    if (!countyId) {
      return NextResponse.json(
        { error: 'Missing required parameter: countyId' },
        { status: 400 }
      );
    }

    // Fetch services that cover this stable's location
    const services = await getServicesForStable(countyId, municipalityId || undefined);
    
    return NextResponse.json(services);
  } catch (error) {
    logger.error('❌ GET services by location failed:', error);
    logger.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: `Failed to fetch services for location: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}