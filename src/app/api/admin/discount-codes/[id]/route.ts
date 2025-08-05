import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/supabase-auth-middleware";
import { prisma } from "@/services/prisma";
import { DiscountType, InvoiceItemType } from "@/generated/prisma";

/**
 * @swagger
 * /api/admin/discount-codes/{id}:
 *   patch:
 *     summary: Update a discount code (Admin only)
 *     description: Updates an existing discount code with new values
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount code ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 1
 *                 description: Unique discount code (will be converted to uppercase)
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Human-readable name for the discount
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
 *                 description: When the discount becomes valid
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: When the discount expires (null for no expiry)
 *               isActive:
 *                 type: boolean
 *                 description: Whether the discount is active
 *               applicableItems:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [BOX_ADVERTISING, SERVICE_ADVERTISING, SPONSORED_PLACEMENT]
 *                 description: Which invoice items this discount applies to (empty means all)
 *     responses:
 *       200:
 *         description: Discount code updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 discountCode:
 *                   type: object
 *                   description: The updated discount code with usage count
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
 *       404:
 *         description: Discount code not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Discount code not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update discount code"
 */
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