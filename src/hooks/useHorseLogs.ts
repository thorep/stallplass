'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export interface CreateLogData {
  description: string;
  images?: string[];
  imageDescriptions?: string[];
}

export interface HorseCustomCategory {
  id: string;
  horseId: string;
  ownerId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    nickname: string;
  };
  _count: {
    logs: number;
  };
}

export interface HorseCustomLog {
  id: string;
  categoryId: string;
  horseId: string;
  profileId: string;
  description: string;
  images: string[];
  imageDescriptions: string[];
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    nickname: string;
  };
}

export interface CreateCustomCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// Query key factories
export const horseLogKeys = {
  all: ['horse-logs'] as const,
  customCategories: (horseId: string) => [...horseLogKeys.all, 'custom-categories', horseId] as const,
  customLogs: (categoryId: string) => [...horseLogKeys.all, 'custom-logs', categoryId] as const,
};


// Custom Categories Hooks
export function useCustomCategories(horseId: string | undefined) {
  return useQuery({
    queryKey: horseLogKeys.customCategories(horseId || ''),
    queryFn: async (): Promise<HorseCustomCategory[]> => {
      if (!horseId) return [];
      
      const response = await fetch(`/api/horses/${horseId}/categories`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch custom categories: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!horseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

export function useCreateCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateCustomCategoryData }) => {
      const response = await fetch(`/api/horses/${horseId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create custom category: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate custom categories for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customCategories(horseId),
      });
    },
  });
}

export function useUpdateCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, categoryId, data }: { 
      horseId: string; 
      categoryId: string; 
      data: Partial<CreateCustomCategoryData> 
    }) => {
      const response = await fetch(`/api/horses/${horseId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update custom category: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate custom categories for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customCategories(horseId),
      });
    },
  });
}

export function useDeleteCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, categoryId }: { horseId: string; categoryId: string }) => {
      const response = await fetch(`/api/horses/${horseId}/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete custom category: ${response.statusText}`);
      }
    },
    onSuccess: (_, { horseId, categoryId }) => {
      // Invalidate custom categories for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customCategories(horseId),
      });
      // Also invalidate logs for this category
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customLogs(categoryId),
      });
    },
  });
}

// Custom Logs Hooks
export function useCustomLogs(categoryId: string | undefined) {
  return useQuery({
    queryKey: horseLogKeys.customLogs(categoryId || ''),
    queryFn: async (): Promise<HorseCustomLog[]> => {
      if (!categoryId) return [];
      
      const response = await fetch(`/api/horses/placeholder/categories/${categoryId}/logs`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch custom logs: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

export function useCreateCustomLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, categoryId, data }: { 
      horseId: string; 
      categoryId: string; 
      data: CreateLogData 
    }) => {
      const response = await fetch(`/api/horses/${horseId}/categories/${categoryId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create custom log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId, categoryId }) => {
      // Invalidate custom logs for this category
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customLogs(categoryId),
      });
      // Also invalidate custom categories to update log count
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customCategories(horseId),
      });
    },
  });
}

export function useUpdateCustomLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, logId, data }: { 
      horseId: string; 
      logId: string; 
      data: Partial<CreateLogData> 
    }) => {
      const response = await fetch(`/api/horses/${horseId}/custom-logs/${logId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update custom log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      // Invalidate custom logs for the category this log belongs to
      if (result.categoryId) {
        queryClient.invalidateQueries({
          queryKey: horseLogKeys.customLogs(result.categoryId),
        });
      }
    },
  });
}

export function useDeleteCustomLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, logId, categoryId: _categoryId }: { 
      horseId: string; 
      logId: string; 
      categoryId: string; 
    }) => {
      const response = await fetch(`/api/horses/${horseId}/custom-logs/${logId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete custom log: ${response.statusText}`);
      }
    },
    onSuccess: (_, { horseId, categoryId }) => {
      // Invalidate custom logs for this category
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customLogs(categoryId),
      });
      // Also invalidate custom categories to update log count
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.customCategories(horseId),
      });
    },
  });
}