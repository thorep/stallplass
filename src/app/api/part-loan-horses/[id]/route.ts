import { requireAuth } from "@/lib/auth";
import {
  deletePartLoanHorse,
  getPartLoanHorseById,
  updatePartLoanHorse,
} from "@/services/part-loan-horse-service";
import { NextRequest, NextResponse } from "next/server";
import { captureApiError } from "@/lib/posthog-capture";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partLoanHorse = await getPartLoanHorseById(id);
    
    if (!partLoanHorse) {
      return NextResponse.json(
        { error: "Part-loan horse not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: partLoanHorse });
  } catch (error) {
    console.error("Error fetching part-loan horse:", error);
    try { const { id } = await params; captureApiError({ error, context: 'part_loan_horse_get', route: '/api/part-loan-horses/[id]', method: 'GET', id }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch part-loan horse" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const partLoanHorse = await updatePartLoanHorse(id, body, user.id);
    
    if (!partLoanHorse) {
      return NextResponse.json(
        { error: "Part-loan horse not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: partLoanHorse });
  } catch (error) {
    console.error("Error updating part-loan horse:", error);
    try { const { id } = await params; captureApiError({ error, context: 'part_loan_horse_update_put', route: '/api/part-loan-horses/[id]', method: 'PUT', id, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to update part-loan horse" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const { id } = await params;
    const success = await deletePartLoanHorse(id, user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Part-loan horse not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting part-loan horse:", error);
    try { const { id } = await params; captureApiError({ error, context: 'part_loan_horse_delete', route: '/api/part-loan-horses/[id]', method: 'DELETE', id, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to delete part-loan horse" },
      { status: 500 }
    );
  }
}
