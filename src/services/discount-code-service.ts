import { prisma } from "./prisma";
import { InvoiceItemType, DiscountType } from "@/generated/prisma";

export interface DiscountCodeValidation {
  isValid: boolean;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount?: number;
  errorMessage?: string;
  discountAmount: number;
  finalAmount: number;
  discountCodeId?: string;
}

export interface ValidateDiscountCodeRequest {
  code: string;
  amount: number;
  itemType: InvoiceItemType;
}

export async function validateDiscountCode({
  code,
  amount,
  itemType,
}: ValidateDiscountCodeRequest): Promise<DiscountCodeValidation> {
  const normalizedCode = code.trim().toUpperCase();

  // Find the discount code
  const discountCode = await prisma.discount_codes.findUnique({
    where: {
      code: normalizedCode,
    },
  });

  if (!discountCode) {
    return {
      isValid: false,
      discountType: "PERCENTAGE",
      discountValue: 0,
      discountAmount: 0,
      finalAmount: amount,
      errorMessage: "Rabattkoden finnes ikke",
    };
  }

  // Check if code is active
  if (!discountCode.isActive) {
    return {
      isValid: false,
      discountType: discountCode.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discountValue: discountCode.discountValue,
      discountAmount: 0,
      finalAmount: amount,
      errorMessage: "Rabattkoden er ikke aktiv",
    };
  }

  // Check if code is within valid date range
  const now = new Date();
  if (discountCode.validFrom > now) {
    return {
      isValid: false,
      discountType: discountCode.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discountValue: discountCode.discountValue,
      discountAmount: 0,
      finalAmount: amount,
      errorMessage: "Rabattkoden er ikke gyldig ennå",
    };
  }

  if (discountCode.validUntil && discountCode.validUntil < now) {
    return {
      isValid: false,
      discountType: discountCode.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discountValue: discountCode.discountValue,
      discountAmount: 0,
      finalAmount: amount,
      errorMessage: "Rabattkoden er utløpt",
    };
  }

  // Check if code applies to this item type
  if (discountCode.applicableItems.length > 0 && !discountCode.applicableItems.includes(itemType)) {
    return {
      isValid: false,
      discountType: discountCode.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discountValue: discountCode.discountValue,
      discountAmount: 0,
      finalAmount: amount,
      errorMessage: "Rabattkoden gjelder ikke for denne typen bestilling",
    };
  }

  // Check minimum order amount
  if (discountCode.minOrderAmount && amount < discountCode.minOrderAmount) {
    return {
      isValid: false,
      discountType: discountCode.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discountValue: discountCode.discountValue,
      discountAmount: 0,
      finalAmount: amount,
      errorMessage: `Minimum bestillingsbeløp er ${discountCode.minOrderAmount} kr`,
    };
  }


  // Calculate discount
  let discountAmount = 0;
  if (discountCode.discountType === DiscountType.PERCENTAGE) {
    discountAmount = (amount * discountCode.discountValue) / 100;
    // Apply max discount limit if set
    if (discountCode.maxDiscount && discountAmount > discountCode.maxDiscount) {
      discountAmount = discountCode.maxDiscount;
    }
  } else if (discountCode.discountType === DiscountType.FIXED_AMOUNT) {
    discountAmount = discountCode.discountValue;
    // Don't allow discount to exceed order amount
    if (discountAmount > amount) {
      discountAmount = amount;
    }
  }

  const finalAmount = Math.max(0, amount - discountAmount);

  return {
    isValid: true,
    discountType: discountCode.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: discountCode.discountValue,
    maxDiscount: discountCode.maxDiscount || undefined,
    discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
    finalAmount: Math.round(finalAmount * 100) / 100,
    discountCodeId: discountCode.id,
  };
}

export async function incrementDiscountCodeUsage(discountCodeId: string): Promise<void> {
  await prisma.discount_codes.update({
    where: { id: discountCodeId },
    data: {
      usageCount: {
        increment: 1,
      },
    },
  });
}

