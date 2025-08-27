import { requireAuth } from "@/lib/auth";
import { captureApiError } from "@/lib/posthog-capture";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBudgetItem } from "@/services/budget-service";

const createSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().int().min(0),
  isRecurring: z.boolean().optional().default(false),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  endMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  intervalMonths: z.number().int().min(1).max(12).nullable().optional(),
  anchorDay: z.number().int().min(1).max(31).nullable().optional(),
  notes: z.string().nullable().optional(),
  emoji: z.string().max(8).nullable().optional(),
});

// POST /api/horses/[id]/budget/items
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const horseId = (await params).id;
    if (!horseId) return NextResponse.json({ error: "Horse ID is required" }, { status: 400 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const item = await createBudgetItem(horseId, user.id, parsed.data);
    if (!item) return NextResponse.json({ error: "Horse not found or access denied" }, { status: 404 });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'budget_item_post', route: '/api/horses/[id]/budget/items', method: 'POST', horseId: id, distinctId: user.id }); } catch {}
    console.error("Error creating budget item:", error);
    return NextResponse.json({ error: "Failed to create budget item" }, { status: 500 });
  }
}
