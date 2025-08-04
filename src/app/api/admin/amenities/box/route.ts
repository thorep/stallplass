import { createApiLogger } from "@/lib/logger";
import { unauthorizedResponse, verifyAdminAccess } from "@/lib/supabase-auth-middleware";
import {
  createBoxAmenity,
  deleteBoxAmenity,
  getAllBoxAmenities,
  updateBoxAmenity,
} from "@/services/amenity-service";
import { NextRequest, NextResponse } from "next/server";

const apiLogger = createApiLogger({
  endpoint: "/api/admin/amenities/box",
  requestId: crypto.randomUUID(),
});

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const amenities = await getAllBoxAmenities();
    return NextResponse.json(amenities);
  } catch {
    return NextResponse.json({ error: "Failed to fetch box amenities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const amenity = await createBoxAmenity(name);
    return NextResponse.json(amenity);
  } catch (error) {
    apiLogger.error(
      {
        method: "POST",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "API request failed"
    );

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Failed to create box amenity" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    const amenity = await updateBoxAmenity(id, name);
    return NextResponse.json(amenity);
  } catch (error) {
    apiLogger.error(
      {
        method: "PUT",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "API request failed"
    );

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Failed to update box amenity" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await deleteBoxAmenity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error(
      {
        method: "DELETE",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "API request failed"
    );

    // Handle known errors
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete box amenity" }, { status: 500 });
  }
}
