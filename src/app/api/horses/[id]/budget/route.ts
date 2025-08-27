import { requireAuth } from "@/lib/auth";
import { captureApiError } from "@/lib/posthog-capture";
import { NextRequest, NextResponse } from "next/server";
import { getBudgetForRange } from "@/services/budget-service";

// GET /api/horses/[id]/budget?from=YYYY-MM&to=YYYY-MM
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const horseId = (await params).id;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!horseId) {
      return NextResponse.json({ error: "Horse ID is required" }, { status: 400 });
    }
    if (!from || !to) {
      return NextResponse.json({ error: "Query params 'from' and 'to' (YYYY-MM) are required" }, { status: 400 });
    }

    const data = await getBudgetForRange(horseId, user.id, from, to);
    if (!data) {
      return NextResponse.json({ error: "Horse not found or access denied" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'budget_get', route: '/api/horses/[id]/budget', method: 'GET', horseId: id, distinctId: user.id }); } catch {}
    console.error("Error fetching budget:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}
