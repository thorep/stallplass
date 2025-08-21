import { getPartLoanHorsesForMap } from "@/services/part-loan-horse-service";
import { NextResponse } from "next/server";
// Removed unused PostHog import

export async function GET() {
  try {
    const partLoanHorses = await getPartLoanHorsesForMap();
    return NextResponse.json({ data: partLoanHorses });
  } catch (error) {
    console.error("Error fetching part-loan horses for map:", error);
    try { const { captureApiError } = await import('@/lib/posthog-capture'); captureApiError({ error, context: 'part_loan_horses_map_get', route: '/api/part-loan-horses/map', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch part-loan horses" },
      { status: 500 }
    );
  }
}
