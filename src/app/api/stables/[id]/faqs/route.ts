import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const stableId = resolvedParams.id;

    const faqs = await prisma.stable_faqs.findMany({
      where: {
        stableId: stableId,
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    return NextResponse.json(faqs || []);
  } catch {
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
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const body = await request.json();
    const { question, answer, sortOrder } = body;

    // Verify user owns this stable
    const stable = await prisma.stables.findUnique({
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
    const faq = await prisma.stable_faqs.create({
      data: {
        stableId: stableId,
        question: question,
        answer: answer,
        sortOrder: sortOrder ?? 0,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(faq);
  } catch {
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
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const body = await request.json();
    const { faqs } = body; // Array of FAQ updates

    // Verify user owns this stable
    const stable = await prisma.stables.findUnique({
      where: { id: stableId },
      select: { ownerId: true }
    });

    if (!stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    if (stable.ownerId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update FAQs - handle each operation separately
    const updatedFAQs = [];

    for (const faq of faqs) {
      if (faq.id.startsWith('temp-')) {
        // Create new FAQ
        const newFAQ = await prisma.stable_faqs.create({
          data: {
            stableId: stableId,
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
            isActive: faq.isActive ?? true,
            updatedAt: new Date()
          }
        });

        updatedFAQs.push(newFAQ);
      } else {
        // Update existing FAQ
        const updatedFAQ = await prisma.stable_faqs.update({
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

    return NextResponse.json(updatedFAQs);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update FAQs' },
      { status: 500 }
    );
  }
}