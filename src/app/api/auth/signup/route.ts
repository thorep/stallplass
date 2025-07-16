import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password, name, email, phone } = await request.json();

    // Validate required fields
    if (!username || !password || !name || !email) {
      return NextResponse.json(
        { error: 'Alle påkrevde felt må fylles ut' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Brukernavn eller e-post er allerede i bruk' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        phone,
        role: 'STABLE_OWNER'
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt. Prøv igjen.' },
      { status: 500 }
    );
  }
}