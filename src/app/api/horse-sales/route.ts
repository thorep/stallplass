import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { createHorseSaleSchema } from '@/lib/horse-sales-validation';
import { HorseSize, HorseGender } from '@/generated/prisma';

export async function GET() {
  try {
    const horseSales = await prisma.horse_sales.findMany({
      where: {
        archived: false,
        deletedAt: null,
      },
      include: {
        breed: true,
        discipline: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        counties: true,
        municipalities: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: horseSales });
  } catch (error) {
    console.error('Error fetching horse sales:', error);
    return NextResponse.json({ error: 'Failed to fetch horse sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input using Zod schema
    const validationResult = createHorseSaleSchema.safeParse({
      ...body,
      price: body.price ? parseInt(body.price) : undefined,
      age: body.age ? parseInt(body.age) : undefined,
      height: body.height ? parseInt(body.height) : undefined,
      latitude: body.latitude ? parseFloat(body.latitude) : undefined,
      longitude: body.longitude ? parseFloat(body.longitude) : undefined,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      // Return the first validation error message as the main error
      const firstError = errors[0];
      return NextResponse.json({ 
        error: firstError?.message || 'Validation failed', 
        details: errors 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Map kommune number to countyId and municipalityId if available
    let countyId = validatedData.countyId || null;
    let municipalityId = validatedData.municipalityId || null;
    
    // If we have a kommuneNumber from the body, look up the IDs
    if (body.kommuneNumber) {
      try {
        const municipalityData = await prisma.municipalities.findFirst({
          where: {
            municipalityNumber: body.kommuneNumber,
          },
          include: {
            counties: true,
          },
        });
        
        if (municipalityData) {
          countyId = municipalityData.countyId;
          municipalityId = municipalityData.id;
        }
      } catch (error) {
        console.error('Error looking up municipality:', error);
      }
    }

    // Remove kommuneNumber from data since it's not a field in the database
    const { kommuneNumber, ...dataForPrisma } = validatedData;

    const horseSale = await prisma.horse_sales.create({
      data: {
        ...dataForPrisma,
        size: validatedData.size as HorseSize, // Properly cast to Prisma enum
        gender: validatedData.gender as HorseGender, // Properly cast to Prisma enum
        height: validatedData.height || null,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
        countyId: countyId as string, // Use looked up ID
        municipalityId: municipalityId as string, // Use looked up ID
        images: validatedData.images || [],
        imageDescriptions: validatedData.imageDescriptions || [],
        userId: user.id,
      },
      include: {
        breed: true,
        discipline: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json({ data: horseSale }, { status: 201 });
  } catch (error) {
    console.error('Error creating horse sale:', error);
    return NextResponse.json({ error: 'Failed to create horse sale' }, { status: 500 });
  }
}