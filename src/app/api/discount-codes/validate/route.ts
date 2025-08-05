import { validateDiscountCode } from "@/services/discount-code-service";
import { InvoiceItemType } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, amount, itemType } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!itemType || !Object.values(InvoiceItemType).includes(itemType)) {
      return NextResponse.json(
        { error: "Valid item type is required" },
        { status: 400 }
      );
    }

    const result = await validateDiscountCode({
      code: code.trim().toUpperCase(),
      amount,
      itemType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error validating discount code:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to validate discount code";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}