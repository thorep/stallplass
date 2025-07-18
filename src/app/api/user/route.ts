import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        firebaseId: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
});