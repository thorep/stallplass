import { requireAuth } from "@/lib/auth";
import { captureApiError } from "@/lib/posthog-capture";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteOverride, upsertOverride } from "@/services/budget-service";

const upsertSchema = z.object({
  budgetItemId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  overrideAmount: z.number().int().min(0).nullable().optional(),
  skip: z.boolean().optional(),
  note: z.string().nullable().optional(),
});

// POST /api/horses/[id]/budget/overrides
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const horseId = (await params).id;
    if (!horseId) return NextResponse.json({ error: "Horse ID is required" }, { status: 400 });

    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const { budgetItemId, month, overrideAmount, skip, note } = parsed.data;
    const result = await upsertOverride(horseId, user.id, budgetItemId, month, overrideAmount, skip, note ?? undefined);
    if (!result) return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'budget_override_post', route: '/api/horses/[id]/budget/overrides', method: 'POST', horseId: id, distinctId: user.id }); } catch {}
    console.error("Error upserting budget override:", error);
    return NextResponse.json({ error: "Failed to set override" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  budgetItemId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

// DELETE /api/horses/[id]/budget/overrides
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const horseId = (await params).id;
    if (!horseId) return NextResponse.json({ error: "Horse ID is required" }, { status: 400 });

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const ok = await deleteOverride(horseId, user.id, parsed.data.budgetItemId, parsed.data.month);
    if (!ok) return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'budget_override_delete', route: '/api/horses/[id]/budget/overrides', method: 'DELETE', horseId: id, distinctId: user.id }); } catch {}
    console.error("Error deleting budget override:", error);
    return NextResponse.json({ error: "Failed to delete override" }, { status: 500 });
  }
}
