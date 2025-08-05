"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/supabase-auth-context";
import { DiscountType, InvoiceItemType } from "@/generated/prisma";

export interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  applicableItems: InvoiceItemType[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoice_requests: number;
  };
}

export interface CreateDiscountCodeData {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
  applicableItems?: InvoiceItemType[];
}

export type UpdateDiscountCodeData = Partial<CreateDiscountCodeData>

// Query keys
const discountCodeKeys = {
  all: ["admin", "discount-codes"] as const,
  lists: () => [...discountCodeKeys.all, "list"] as const,
  detail: (id: string) => [...discountCodeKeys.all, "detail", id] as const,
};

// Get all discount codes
export function useGetAdminDiscountCodes() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: discountCodeKeys.lists(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch("/api/admin/discount-codes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch discount codes");
      }

      const data = await response.json();
      return data.discountCodes as DiscountCode[];
    },
  });
}

// Create a new discount code
export function useCreateAdminDiscountCode() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDiscountCodeData) => {
      const token = await getIdToken();
      const response = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create discount code");
      }

      const result = await response.json();
      return result.discountCode as DiscountCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountCodeKeys.all });
    },
  });
}

// Update a discount code
export function useUpdateAdminDiscountCode() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDiscountCodeData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update discount code");
      }

      const result = await response.json();
      return result.discountCode as DiscountCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountCodeKeys.all });
    },
  });
}

// Delete or deactivate a discount code
export function useDeleteAdminDiscountCode() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/discount-codes?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete discount code");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountCodeKeys.all });
    },
  });
}