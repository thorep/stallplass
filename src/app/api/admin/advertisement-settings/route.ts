import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/services/prisma';
import { NextResponse } from 'next/server';

// Get current advertisement settings
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    console.log('Prisma client admin_settings:', prisma.admin_settings);
    
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
    console.error('Error fetching advertisement settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisement settings' },
      { status: 500 }
    );
  }
}

// Update advertisement settings
export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { advertisementChance, advertisementMinPos, advertisementMaxPos } = body;

    // Validation
    if (
      typeof advertisementChance !== 'number' ||
      typeof advertisementMinPos !== 'number' ||
      typeof advertisementMaxPos !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid input: all fields must be numbers' },
        { status: 400 }
      );
    }

    if (advertisementChance < 0 || advertisementChance > 100) {
      return NextResponse.json(
        { error: 'Advertisement chance must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (advertisementMinPos < 1 || advertisementMaxPos < advertisementMinPos) {
      return NextResponse.json(
        { error: 'Invalid position range: min must be >= 1 and max must be >= min' },
        { status: 400 }
      );
    }

    // Get existing settings or create new ones
    let settings = await prisma.admin_settings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.admin_settings.update({
        where: { id: settings.id },
        data: {
          advertisementChance,
          advertisementMinPos,
          advertisementMaxPos,
        },
      });
    } else {
      // Create new settings
      settings = await prisma.admin_settings.create({
        data: {
          advertisementChance,
          advertisementMinPos,
          advertisementMaxPos,
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
    console.error('Error updating advertisement settings:', error);
    return NextResponse.json(
      { error: 'Failed to update advertisement settings' },
      { status: 500 }
    );
  }
}