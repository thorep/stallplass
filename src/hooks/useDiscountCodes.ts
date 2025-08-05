"use client";

import { useMutation } from "@tanstack/react-query";
import { InvoiceItemType } from "@/generated/prisma";

export interface DiscountCodeValidation {
  isValid: boolean;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount?: number;
  errorMessage?: string;
  discountAmount: number; // Calculated discount amount
  finalAmount: number; // Final amount after discount
  discountCodeId?: string; // ID of the discount code if valid
}

export interface ValidateDiscountCodeRequest {
  code: string;
  amount: number;
  itemType: InvoiceItemType;
}

async function validateDiscountCode({
  code,
  amount,
  itemType,
}: ValidateDiscountCodeRequest): Promise<DiscountCodeValidation> {
  const response = await fetch("/api/discount-codes/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, amount, itemType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to validate discount code");
  }

  return response.json();
}

export function useValidateDiscountCode() {
  return useMutation({
    mutationFn: validateDiscountCode,
    mutationKey: ["validateDiscountCode"],
  });
}