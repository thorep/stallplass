import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getBudgetForRange } from "@/services/budget-service";

// GET /api/budget/overview?from=YYYY-MM&to=YYYY-MM
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const user = auth;
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json({ error: "from and to (YYYY-MM) required" }, { status: 400 });
    }

    // Get all active horses owned by user
    const horses = await prisma.horses.findMany({
      where: { ownerId: user.id, archived: false, deletedAt: null },
      select: { id: true },
    });
    const months: Record<string, number> = {};

    for (const h of horses) {
      const res = await getBudgetForRange(h.id, user.id, from, to);
      if (!res) continue;
      for (const m of res.months) {
        months[m.month] = (months[m.month] || 0) + (m.total || 0);
      }
    }

    // Normalize to sorted array between from..to
    const out: { month: string; total: number }[] = [];
    const [fy, fm] = from.split("-").map((v) => parseInt(v, 10));
    const [ty, tm] = to.split("-").map((v) => parseInt(v, 10));
    let cy = fy,
      cm = fm;
    while (cy < ty || (cy === ty && cm <= tm)) {
      const key = `${cy}-${String(cm).padStart(2, "0")}`;
      out.push({ month: key, total: months[key] || 0 });
      cm++;
      if (cm === 13) {
        cm = 1;
        cy++;
      }
    }

    return NextResponse.json({ months: out });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to build overview" }, { status: 500 });
  }
}

