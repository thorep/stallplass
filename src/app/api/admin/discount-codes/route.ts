import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/supabase-auth-middleware";
import { prisma } from "@/services/prisma";
import { DiscountType, InvoiceItemType } from "@/generated/prisma";

/**
 * @swagger
 * /api/admin/discount-codes:
 *   get:
 *     summary: Get all discount codes (Admin only)
 *     description: Retrieves all discount codes with usage statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Discount codes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 discountCodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Discount code ID
 *                       code:
 *                         type: string
 *                         description: Discount code
 *                       name:
 *                         type: string
 *                         description: Discount code name
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         description: Discount code description
 *                       discountType:
 *                         type: string
 *                         enum: [PERCENTAGE, FIXED_AMOUNT]
 *                         description: Type of discount
 *                       discountValue:
 *                         type: number
 *                         description: Discount value (percentage or fixed amount)
 *                       minOrderAmount:
 *                         type: number
 *                         nullable: true
 *                         description: Minimum order amount required
 *                       maxDiscount:
 *                         type: number
 *                         nullable: true
 *                         description: Maximum discount amount (for percentage discounts)
 *                       validFrom:
 *                         type: string
 *                         format: date-time
 *                         description: When the discount becomes valid
 *                       validUntil:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: When the discount expires
 *                       isActive:
 *                         type: boolean
 *                         description: Whether the discount is active
 *                       applicableItems:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum: [BOX_ADVERTISING, SERVICE_ADVERTISING, SPONSORED_PLACEMENT]
 *                         description: Which items this discount applies to
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           invoice_requests:
 *                             type: number
 *                             description: Number of times this code has been used
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new discount code (Admin only)
 *     description: Creates a new discount code that users can apply to their invoices
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - discountType
 *               - discountValue
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 1
 *                 description: Unique discount code (will be converted to uppercase)
 *                 example: "SUMMER2024"
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Human-readable name for the discount
 *                 example: "Summer 2024 Discount"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Optional description of the discount
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 description: Type of discount to apply
 *               discountValue:
 *                 type: number
 *                 minimum: 0
 *                 description: Discount value (percentage 0-100 or fixed amount)
 *               minOrderAmount:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *                 description: Minimum order amount required to use this discount
 *               maxDiscount:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *                 description: Maximum discount amount (useful for percentage discounts)
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: When the discount becomes valid (defaults to now)
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: When the discount expires (null for no expiry)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the discount is active
 *               applicableItems:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [BOX_ADVERTISING, SERVICE_ADVERTISING, SPONSORED_PLACEMENT]
 *                 description: Which invoice items this discount applies to (empty means all)
 *     responses:
 *       200:
 *         description: Discount code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 discountCode:
 *                   type: object
 *                   description: The created discount code
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "A discount code with this code already exists"
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete or deactivate a discount code (Admin only)
 *     description: Deletes a discount code if unused, or deactivates it if it has been used in invoices
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount code ID to delete
 *     responses:
 *       200:
 *         description: Discount code deleted or deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Discount code deleted successfully"
 *                 deleted:
 *                   type: boolean
 *                   description: True if deleted, false if deactivated
 *                 deactivated:
 *                   type: boolean
 *                   description: True if deactivated instead of deleted
 *       400:
 *         description: Missing required ID parameter
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Discount code not found
 *       500:
 *         description: Internal server error
 */
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