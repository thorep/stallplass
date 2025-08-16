import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export interface PartLoanHorse {
  id: string;
  name: string;
  description: string;
  address: string | null;
  postalCode: string | null;
  postalPlace: string | null;
  latitude: number | null;
  longitude: number | null;
  countyId: string | null;
  municipalityId: string | null;
  images: string[];
  imageDescriptions: string[];
  userId: string;
  viewCount: number;
  archived: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  profiles: {
    id: string;
    nickname: string;
    firstname: string | null;
    lastname: string | null;
  };
  counties: {
    id: string;
    name: string;
    countyNumber: string;
  } | null;
  municipalities: {
    id: string;
    name: string;
    municipalityNumber: string;
  } | null;
}

export interface CreatePartLoanHorseData {
  name: string;
  description: string;
  address: string;
  postalCode?: string;
  postalPlace?: string;
  latitude?: number;
  longitude?: number;
  countyId?: string;
  municipalityId?: string;
  images?: string[];
  imageDescriptions?: string[];
}

export interface UpdatePartLoanHorseData {
  name?: string;
  description?: string;
  address?: string;
  postalCode?: string;
  postalPlace?: string;
  latitude?: number;
  longitude?: number;
  countyId?: string;
  municipalityId?: string;
  images?: string[];
  imageDescriptions?: string[];
}

const PART_LOAN_HORSES_QUERY_KEY = "partLoanHorses";

export function usePartLoanHorsesByUser(userId?: string) {
  return useQuery({
    queryKey: [PART_LOAN_HORSES_QUERY_KEY, "user", userId],
    queryFn: async (): Promise<PartLoanHorse[]> => {
      const response = await fetch("/api/part-loan-horses", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch part-loan horses");
      }
      
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!userId,
  });
}

export function usePartLoanHorse(id?: string) {
  return useQuery({
    queryKey: [PART_LOAN_HORSES_QUERY_KEY, id],
    queryFn: async (): Promise<PartLoanHorse> => {
      const response = await fetch(`/api/part-loan-horses/${id}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch part-loan horse");
      }
      
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

export function usePartLoanHorseMutations() {
  const queryClient = useQueryClient();

  const invalidatePartLoanHorses = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [PART_LOAN_HORSES_QUERY_KEY],
    });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (data: CreatePartLoanHorseData): Promise<PartLoanHorse> => {
      const response = await fetch("/api/part-loan-horses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create part-loan horse");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      invalidatePartLoanHorses();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: UpdatePartLoanHorseData 
    }): Promise<PartLoanHorse> => {
      const response = await fetch(`/api/part-loan-horses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update part-loan horse");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      invalidatePartLoanHorses();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/part-loan-horses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete part-loan horse");
      }
    },
    onSuccess: () => {
      invalidatePartLoanHorses();
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    invalidatePartLoanHorses,
  };
}