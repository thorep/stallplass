import { prisma } from '@/services/prisma';
import { NextResponse } from 'next/server';

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