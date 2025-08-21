import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { requireAuth } from '@/lib/auth';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
  // Track user id for error capture without leaking scope
  let distinctId: string | undefined;
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    distinctId = user.id;

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

    if (stable.ownerId !== user.id) {
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
  } catch (error) {
    try { const { id, faqId } = await params; captureApiError({ error, context: 'stable_faq_delete', route: '/api/stables/[id]/faqs/[faqId]', method: 'DELETE', stableId: id, faqId, distinctId }); } catch {}
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
