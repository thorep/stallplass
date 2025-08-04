import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const faqId = resolvedParams.faqId;

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

    // Verify FAQ belongs to this stable
    const faq = await prisma.stable_faqs.findUnique({
      where: { id: faqId },
      select: { stableId: true }
    });

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    if (faq.stableId !== stableId) {
      return NextResponse.json({ error: 'FAQ does not belong to this stable' }, { status: 403 });
    }

    // Delete FAQ
    await prisma.stable_faqs.delete({
      where: { id: faqId }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}