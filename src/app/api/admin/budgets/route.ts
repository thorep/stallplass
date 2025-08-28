import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/services/prisma';
import { captureApiError } from '@/lib/posthog-capture';

// GET /api/admin/budgets
// Returns all horses that have budgets, with their owner and budget items (including overrides)
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const horses = await prisma.horses.findMany({
      where: {
        budget_items: { some: {} },
      },
      include: {
        profiles: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            nickname: true,
          },
        },
        budget_items: {
          include: {
            overrides: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Normalize output a bit for the client
    const result = horses.map((h) => ({
      id: h.id,
      name: h.name,
      owner: h.profiles,
      createdAt: h.createdAt,
      budgetItems: h.budget_items.map((it) => ({
        id: it.id,
        title: it.title,
        category: it.category,
        amount: it.amount,
        isRecurring: it.isRecurring,
        startMonth: it.startMonth,
        endMonth: it.endMonth,
        intervalMonths: it.intervalMonths,
        intervalWeeks: it.intervalWeeks,
        weekday: it.weekday,
        anchorDay: it.anchorDay,
        emoji: it.emoji,
        notes: it.notes,
        createdAt: it.createdAt,
        overrides: it.overrides,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin budgets:', error);
    try { captureApiError({ error, context: 'admin_budgets_get', route: '/api/admin/budgets', method: 'GET' }); } catch {}
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

