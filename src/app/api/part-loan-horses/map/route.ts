import { getPartLoanHorsesForMap } from "@/services/part-loan-horse-service";
import { NextResponse } from "next/server";
import { getPostHogServer } from "@/lib/posthog-server";

export async function GET() {
  try {
    const partLoanHorses = await getPartLoanHorsesForMap();
    return NextResponse.json({ data: partLoanHorses });
  } catch (error) {
    console.error("Error fetching part-loan horses for map:", error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'part_loan_horses_map_get' }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch part-loan horses" },
      { status: 500 }
    );
  }
}
