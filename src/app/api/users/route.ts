import { NextRequest, NextResponse } from 'next/server';
import { ensureUserExists } from '@/services/user-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const userData = {
      id: body.userId,
      email: body.email,
      name: body.name,
      phone: body.phone,
      updatedAt: new Date() // Required field
    };

    // Validate required fields
    if (!userData.id || !userData.email) {
      return NextResponse.json(
        { error: 'UserId and email are required' },
        { status: 400 }
      );
    }

    const user = await ensureUserExists(userData);
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}