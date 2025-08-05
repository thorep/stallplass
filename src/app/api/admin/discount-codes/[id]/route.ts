import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/supabase-auth-middleware";
import { prisma } from "@/services/prisma";
import { DiscountType, InvoiceItemType } from "@/generated/prisma";

// PATCH /api/admin/discount-codes/[id] - Update a discount code
export const PATCH = withAdminAuth(async (request: NextRequest) => {
  try {
    // Extract ID from URL pathname
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    const body = await request.json();

    // Check if discount code exists
    const existingCode = await prisma.discount_codes.findUnique({
      where: { id },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // Validate discount type if provided
    if (body.discountType && !Object.values(DiscountType).includes(body.discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discount value if provided
    if (body.discountValue !== undefined) {
      if (body.discountValue <= 0) {
        return NextResponse.json(
          { error: "Discount value must be greater than 0" },
          { status: 400 }
        );
      }

      // For percentage discounts, ensure value is not over 100
      const discountType = body.discountType || existingCode.discountType;
      if (discountType === DiscountType.PERCENTAGE && body.discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        );
      }
    }

    // Validate applicable items if provided
    if (body.applicableItems && body.applicableItems.length > 0) {
      const validItems = body.applicableItems.every((item: string) =>
        Object.values(InvoiceItemType).includes(item as InvoiceItemType)
      );
      if (!validItems) {
        return NextResponse.json(
          { error: "Invalid applicable items" },
          { status: 400 }
        );
      }
    }

    // Update the discount code
    const updatedCode = await prisma.discount_codes.update({
      where: { id },
      data: {
        ...(body.code && { code: body.code.trim().toUpperCase() }),
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.discountType && { discountType: body.discountType }),
        ...(body.discountValue !== undefined && { discountValue: body.discountValue }),
        ...(body.minOrderAmount !== undefined && { minOrderAmount: body.minOrderAmount }),
        ...(body.maxDiscount !== undefined && { maxDiscount: body.maxDiscount }),
        ...(body.validFrom && { validFrom: new Date(body.validFrom) }),
        ...(body.validUntil !== undefined && { 
          validUntil: body.validUntil ? new Date(body.validUntil) : null 
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.applicableItems !== undefined && { applicableItems: body.applicableItems }),
      },
      include: {
        _count: {
          select: {
            invoice_requests: true,
          },
        },
      },
    });

    return NextResponse.json({ discountCode: updatedCode });
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A discount code with this code already exists" },
        { status: 400 }
      );
    }

    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 }
    );
  }
});