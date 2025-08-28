import { requireAuth } from "@/lib/auth";
import { captureApiError } from "@/lib/posthog-capture";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteBudgetItem, updateBudgetItem, getBudgetItem } from "@/services/budget-service";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().int().min(0).optional(),
  isRecurring: z.boolean().optional(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  endMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  intervalMonths: z.number().int().min(1).max(12).nullable().optional(),
  intervalWeeks: z.number().int().min(1).max(52).nullable().optional(),
  weekday: z.number().int().min(1).max(7).nullable().optional(),
  anchorDay: z.number().int().min(1).max(31).nullable().optional(),
  notes: z.string().nullable().optional(),
  emoji: z.string().max(8).nullable().optional(),
});

// PATCH /api/horses/[id]/budget/items/[itemId]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const { id: horseId, itemId } = await params;
    if (!horseId || !itemId) return NextResponse.json({ error: "Horse ID and Item ID are required" }, { status: 400 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const updated = await updateBudgetItem(horseId, user.id, itemId, parsed.data);
    if (!updated) return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'budget_item_patch', route: '/api/horses/[id]/budget/items/[itemId]', method: 'PATCH', horseId: id, distinctId: user.id }); } catch {}
    console.error("Error updating budget item:", error);
    return NextResponse.json({ error: "Failed to update budget item" }, { status: 500 });
  }
}

// GET /api/horses/[id]/budget/items/[itemId]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const { id: horseId, itemId } = await params;
    if (!horseId || !itemId) return NextResponse.json({ error: "Horse ID and Item ID are required" }, { status: 400 });
    const item = await getBudgetItem(horseId, user.id, itemId);
    if (!item) return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'budget_item_get', route: '/api/horses/[id]/budget/items/[itemId]', method: 'GET', horseId: id, distinctId: user.id }); } catch {}
    console.error("Error fetching budget item:", error);
    return NextResponse.json({ error: "Failed to fetch budget item" }, { status: 500 });
  }
}

// DELETE /api/horses/[id]/budget/items/[itemId]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const { id: horseId, itemId } = await params;
    if (!horseId || !itemId) return NextResponse.json({ error: "Horse ID and Item ID are required" }, { status: 400 });

    const ok = await deleteBudgetItem(horseId, user.id, itemId);
    if (!ok) return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'budget_item_delete', route: '/api/horses/[id]/budget/items/[itemId]', method: 'DELETE', horseId: id, distinctId: user.id }); } catch {}
    console.error("Error deleting budget item:", error);
    return NextResponse.json({ error: "Failed to delete budget item" }, { status: 500 });
  }
}
