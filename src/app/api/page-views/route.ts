import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { Prisma } from '@/generated/prisma';
import type { EntityType } from '@/generated/prisma';
import { logger } from '@/lib/logger';
// Removed unused PostHog import
import { captureApiError } from '@/lib/posthog-capture';

// In-memory, best-effort server-side dedupe of recent views
// Note: In serverless environments this cache is per-instance and ephemeral
const recentViewCache = new Map<string, number>();
const SERVER_DEDUPE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown';
  const real = request.headers.get('x-real-ip');
  return real || 'unknown';
}

function getSessionId(request: NextRequest): { id: string; isNew: boolean } {
  const existing = request.cookies.get('pv_session')?.value;
  if (existing) return { id: existing, isNew: false };
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return { id, isNew: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, viewerId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const validEntityTypes: Array<EntityType | 'HORSE_SALE' | 'HORSE_BUY'> = ['STABLE', 'BOX', 'SERVICE', 'PART_LOAN_HORSE', 'HORSE_SALE', 'HORSE_BUY'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    // For authenticated users, check if they own the content and skip if they do
    if (viewerId && !viewerId.startsWith('anon-')) {
      let isOwner = false;
      
      if (entityType === 'STABLE') {
        const stable = await prisma.stables.findUnique({
          where: { id: entityId },
          select: { ownerId: true }
        });
        isOwner = stable?.ownerId === viewerId;
      } else if (entityType === 'BOX') {
        const box = await prisma.boxes.findUnique({
          where: { id: entityId },
          select: { stables: { select: { ownerId: true } } }
        });
        isOwner = box?.stables?.ownerId === viewerId;
      } else if (entityType === 'SERVICE') {
        const service = await prisma.services.findUnique({
          where: { id: entityId },
          select: { userId: true }
        });
        isOwner = service?.userId === viewerId;
      } else if (entityType === 'PART_LOAN_HORSE') {
        const partLoanHorse = await prisma.part_loan_horses.findUnique({
          where: { id: entityId },
          select: { userId: true }
        });
        isOwner = partLoanHorse?.userId === viewerId;
      } else if (entityType === 'HORSE_SALE') {
        const horseSale = await prisma.horse_sales.findUnique({
          where: { id: entityId },
          select: { userId: true }
        });
        isOwner = horseSale?.userId === viewerId;
      } else if (entityType === 'HORSE_BUY') {
        const horseBuy = await prisma.horse_buys.findUnique({
          where: { id: entityId },
          select: { userId: true }
        });
        isOwner = horseBuy?.userId === viewerId;
      }
      
      if (isOwner) {
        const res = NextResponse.json({ 
          entityType, 
          entityId, 
          skipped: true,
          reason: 'Owner views are not tracked'
        }, { status: 200 });
        // Ensure pv_session cookie is set for future dedupe
        const { id: sid, isNew } = getSessionId(request);
        if (isNew) res.cookies.set('pv_session', sid, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
        return res;
      }
    }

    // Server-side dedupe using pv_session cookie (preferred) or IP+UA fallback
    const { id: sessionId, isNew } = getSessionId(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = getClientIp(request);
    const dedupeKey = `e:${entityType}:${entityId}:s:${sessionId}:ua:${userAgent.split(')')[0]}`; // compact key
    const now = Date.now();
    const last = recentViewCache.get(dedupeKey);
    if (last && (now - last) < SERVER_DEDUPE_WINDOW_MS) {
      const res = NextResponse.json({
        entityType,
        entityId,
        skipped: true,
        reason: 'Recent view already counted',
      }, { status: 200 });
      if (isNew) res.cookies.set('pv_session', sessionId, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
      return res;
    }

    // Increment the view counter using raw SQL to avoid touching updatedAt
    // and to bypass audit logging middleware
    const tableByEntity: Record<string, string> = {
      STABLE: 'stables',
      BOX: 'boxes',
      SERVICE: 'services',
      PART_LOAN_HORSE: 'part_loan_horses',
      HORSE_SALE: 'horse_sales',
      HORSE_BUY: 'horse_buys',
    };
    const table = tableByEntity[entityType as keyof typeof tableByEntity];
    let newCount = 0;
    if (table) {
      const rows = await prisma.$queryRaw<{ viewCount: number }[]>`
        UPDATE ${Prisma.raw(table)}
        SET "viewCount" = COALESCE("viewCount", 0) + 1
        WHERE id = ${entityId}
        RETURNING "viewCount"
      `;
      newCount = rows[0]?.viewCount ?? 0;
    }

    // Update dedupe cache and set cookie if needed
    recentViewCache.set(dedupeKey, Date.now());
    const res = NextResponse.json({ entityType, entityId, viewCount: newCount }, { status: 200 });
    if (isNew) res.cookies.set('pv_session', sessionId, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (error) {
    logger.error('View tracking error:', error);
    try { captureApiError({ error, context: 'page_view_track_post', route: '/api/page-views', method: 'POST' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}
