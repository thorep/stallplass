import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    
    const { userId, email, name } = body;
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // First check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists in database', 
        user: existingUser 
      });
    }

    // Create new user with minimal required fields
    const newUser = await prisma.users.create({
      data: {
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        firebaseId: userId
      }
    });


    return NextResponse.json({ 
      message: 'User created successfully', 
      user: newUser 
    });

  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}