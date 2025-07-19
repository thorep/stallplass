import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const stableId = resolvedParams.id;

    const faqs = await prisma.stableFAQ.findMany({
      where: {
        stableId,
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    return NextResponse.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const body = await request.json();
    const { question, answer, sortOrder } = body;

    // Verify user owns this stable
    const stable = await prisma.stable.findUnique({
      where: { id: stableId },
      select: { ownerId: true }
    });

    if (!stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    if (stable.ownerId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create FAQ
    const faq = await prisma.stableFAQ.create({
      data: {
        stableId,
        question,
        answer,
        sortOrder: sortOrder ?? 0
      }
    });

    return NextResponse.json(faq);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const body = await request.json();
    const { faqs } = body; // Array of FAQ updates

    // Verify user owns this stable
    const stable = await prisma.stable.findUnique({
      where: { id: stableId },
      select: { ownerId: true }
    });

    if (!stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    if (stable.ownerId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update FAQs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedFAQs = [];

      for (const faq of faqs) {
        if (faq.id.startsWith('temp-')) {
          // Create new FAQ
          const newFAQ = await tx.stableFAQ.create({
            data: {
              stableId,
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder,
              isActive: faq.isActive
            }
          });
          updatedFAQs.push(newFAQ);
        } else {
          // Update existing FAQ
          const updatedFAQ = await tx.stableFAQ.update({
            where: { id: faq.id },
            data: {
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder,
              isActive: faq.isActive
            }
          });
          updatedFAQs.push(updatedFAQ);
        }
      }

      return updatedFAQs;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQs' },
      { status: 500 }
    );
  }
}