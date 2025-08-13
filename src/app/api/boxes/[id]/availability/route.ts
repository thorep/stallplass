import { createApiLogger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { updateBoxAvailability } from "@/services/box-service";
import { NextRequest, NextResponse } from "next/server";

const apiLogger = createApiLogger({
  endpoint: "/api/boxes/:id/availability",
  requestId: crypto.randomUUID(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
    try {
      const params = await context.params;
      const { id: boxId } = params;
      const { isAvailable } = await request.json();

      if (typeof isAvailable !== "boolean") {
        return NextResponse.json({ error: "isAvailable must be a boolean" }, { status: 400 });
      }

      const updatedBox = await updateBoxAvailability(boxId, user.id, isAvailable);

      return NextResponse.json({ box: updatedBox });
    } catch (error) {
      apiLogger.error(
        {
          method: "PATCH",
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        "API request failed"
      );

      if (error instanceof Error) {
        if (error.message === "Box not found") {
          return NextResponse.json({ error: "Box not found" }, { status: 404 });
        }
        if (error.message === "Unauthorized") {
          return NextResponse.json(
            { error: "You can only update your own boxes" },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({ error: "Failed to update box availability" }, { status: 500 });
    }
}
