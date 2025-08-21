import { requireAuth } from "@/lib/auth";
import {
  createPartLoanHorse,
  getPartLoanHorsesByUser,
} from "@/services/part-loan-horse-service";
import { NextRequest, NextResponse } from "next/server";
import { getPostHogServer } from "@/lib/posthog-server";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const partLoanHorses = await getPartLoanHorsesByUser(user.id);
    return NextResponse.json({ data: partLoanHorses });
  } catch (error) {
    console.error("Error fetching part-loan horses:", error);
    try { const ph = getPostHogServer(); ph.captureException(error, user.id, { context: 'part_loan_horses_get' }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch part-loan horses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      address, 
      postalCode,
      postalPlace,
      latitude,
      longitude,
      countyId,
      municipalityId,
      kommuneNumber,
      images, 
      imageDescriptions 
    } = body;

    if (!name || !description || !address) {
      return NextResponse.json(
        { error: "Name, description, and address are required" },
        { status: 400 }
      );
    }

    const partLoanHorse = await createPartLoanHorse({
      name,
      description,
      address,
      postalCode,
      postalPlace,
      latitude,
      longitude,
      countyId,
      municipalityId,
      kommuneNumber,
      images: images || [],
      imageDescriptions: imageDescriptions || [],
      userId: user.id,
    });

    return NextResponse.json({ data: partLoanHorse }, { status: 201 });
  } catch (error) {
    console.error("Error creating part-loan horse:", error);
    try { const ph = getPostHogServer(); ph.captureException(error, user.id, { context: 'part_loan_horse_create' }); } catch {}
    return NextResponse.json(
      { error: "Failed to create part-loan horse" },
      { status: 500 }
    );
  }
}
