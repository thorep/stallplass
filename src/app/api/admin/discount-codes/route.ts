import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/supabase-auth-middleware";
import { prisma } from "@/services/prisma";
import { DiscountType, InvoiceItemType } from "@/generated/prisma";

// GET /api/admin/discount-codes - List all discount codes
export const GET = withAdminAuth(async () => {
  try {
    const discountCodes = await prisma.discount_codes.findMany({
      orderBy: [
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        _count: {
          select: {
            invoice_requests: true,
          },
        },
      },
    });

    return NextResponse.json({ discountCodes });
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount codes" },
      { status: 500 }
    );
  }
});

// POST /api/admin/discount-codes - Create a new discount code
export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["code", "name", "discountType", "discountValue"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate discount type
    if (!Object.values(DiscountType).includes(body.discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discount value
    if (body.discountValue <= 0) {
      return NextResponse.json(
        { error: "Discount value must be greater than 0" },
        { status: 400 }
      );
    }

    // For percentage discounts, ensure value is not over 100
    if (body.discountType === DiscountType.PERCENTAGE && body.discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
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

    // Create the discount code
    const discountCode = await prisma.discount_codes.create({
      data: {
        code: body.code.trim().toUpperCase(),
        name: body.name,
        description: body.description || null,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minOrderAmount: body.minOrderAmount || null,
        maxDiscount: body.maxDiscount || null,
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        isActive: body.isActive !== false, // Default to true
        applicableItems: body.applicableItems || [],
      },
    });

    return NextResponse.json({ discountCode });
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A discount code with this code already exists" },
        { status: 400 }
      );
    }

    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { error: "Failed to create discount code" },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/discount-codes - Delete a discount code
export const DELETE = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Discount code ID is required" },
        { status: 400 }
      );
    }

    // Check if the discount code exists
    const discountCode = await prisma.discount_codes.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoice_requests: true,
          },
        },
      },
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // If the code has been used, we might want to just deactivate it instead of deleting
    if (discountCode._count.invoice_requests > 0) {
      // Deactivate instead of delete to preserve history
      await prisma.discount_codes.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Discount code deactivated (has been used in invoices)",
        deactivated: true,
      });
    }

    // Delete the discount code if it hasn't been used
    await prisma.discount_codes.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Discount code deleted successfully",
      deleted: true,
    });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 }
    );
  }
});