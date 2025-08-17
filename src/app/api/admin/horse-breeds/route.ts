import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

export async function GET() {
  try {
    const breeds = await prisma.horse_breeds.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: breeds });
  } catch (error) {
    console.error('Error fetching horse breeds:', error);
    return NextResponse.json({ error: 'Failed to fetch horse breeds' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const breed = await prisma.horse_breeds.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ data: breed }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating horse breed:', error);
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Breed already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create horse breed' }, { status: 500 });
  }
}