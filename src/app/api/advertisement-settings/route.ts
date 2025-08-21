import { prisma } from '@/services/prisma';
import { NextResponse } from 'next/server';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

// Public endpoint to get advertisement settings (no auth required)
export async function GET() {
  try {
    // Get the first (and should be only) settings record
    let settings = await prisma.admin_settings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.admin_settings.create({
        data: {
          advertisementChance: 50.0,
          advertisementMinPos: 1,
          advertisementMaxPos: 40,
        },
      });
    }

    return NextResponse.json({
      data: {
        advertisementChance: settings.advertisementChance,
        advertisementMinPos: settings.advertisementMinPos,
        advertisementMaxPos: settings.advertisementMaxPos,
      },
    });
  } catch (error) {
    console.error('Error fetching public advertisement settings:', error);
    try { captureApiError({ error, context: 'public_advertisement_settings_get', route: '/api/advertisement-settings', method: 'GET' }); } catch {}
    
    // Return default values if database fails
    return NextResponse.json({
      data: {
        advertisementChance: 50.0,
        advertisementMinPos: 1,
        advertisementMaxPos: 40,
      },
    });
  }
}
