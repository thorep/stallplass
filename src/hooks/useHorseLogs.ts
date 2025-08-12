'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

export interface HorseCareLog {
  id: string;
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

export interface HorseExerciseLog {
  id: string;
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

export interface HorseFeedingLog {
  id: string;
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

export interface HorseMedicalLog {
  id: string;
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

export interface HorseOtherLog {
  id: string;
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
  careLogs: (horseId: string) => [...horseLogKeys.all, 'care', horseId] as const,
  exerciseLogs: (horseId: string) => [...horseLogKeys.all, 'exercise', horseId] as const,
  feedingLogs: (horseId: string) => [...horseLogKeys.all, 'feeding', horseId] as const,
  medicalLogs: (horseId: string) => [...horseLogKeys.all, 'medical', horseId] as const,
  otherLogs: (horseId: string) => [...horseLogKeys.all, 'other', horseId] as const,
  customCategories: (horseId: string) => [...horseLogKeys.all, 'custom-categories', horseId] as const,
  customLogs: (categoryId: string) => [...horseLogKeys.all, 'custom-logs', categoryId] as const,
};

// Care Log Hooks
export function useCareLogs(horseId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseLogKeys.careLogs(horseId || ''),
    queryFn: async (): Promise<HorseCareLog[]> => {
      if (!horseId) return [];
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/care-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch care logs: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!horseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

export function useCreateCareLog() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateLogData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/care-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create care log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate care logs for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.careLogs(horseId),
      });
    },
  });
}

// Exercise Log Hooks
export function useExerciseLogs(horseId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseLogKeys.exerciseLogs(horseId || ''),
    queryFn: async (): Promise<HorseExerciseLog[]> => {
      if (!horseId) return [];
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/exercise-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercise logs: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!horseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

export function useCreateExerciseLog() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateLogData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/exercise-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create exercise log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate exercise logs for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.exerciseLogs(horseId),
      });
    },
  });
}

// Feeding Log Hooks
export function useFeedingLogs(horseId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseLogKeys.feedingLogs(horseId || ''),
    queryFn: async (): Promise<HorseFeedingLog[]> => {
      if (!horseId) return [];
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/feeding-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feeding logs: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!horseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

export function useCreateFeedingLog() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateLogData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/feeding-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create feeding log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate feeding logs for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.feedingLogs(horseId),
      });
    },
  });
}

// Medical Log Hooks
export function useMedicalLogs(horseId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseLogKeys.medicalLogs(horseId || ''),
    queryFn: async (): Promise<HorseMedicalLog[]> => {
      if (!horseId) return [];
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/medical-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch medical logs: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!horseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

export function useCreateMedicalLog() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateLogData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/medical-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create medical log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate medical logs for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.medicalLogs(horseId),
      });
    },
  });
}

// Other Log Hooks
export function useOtherLogs(horseId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseLogKeys.otherLogs(horseId || ''),
    queryFn: async (): Promise<HorseOtherLog[]> => {
      if (!horseId) return [];
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/other-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch other logs: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!horseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

export function useCreateOtherLog() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateLogData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/other-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create other log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate other logs for this horse
      queryClient.invalidateQueries({
        queryKey: horseLogKeys.otherLogs(horseId),
      });
    },
  });
}

// Custom Categories Hooks
export function useCustomCategories(horseId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseLogKeys.customCategories(horseId || ''),
    queryFn: async (): Promise<HorseCustomCategory[]> => {
      if (!horseId) return [];
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateCustomCategoryData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, categoryId, data }: { 
      horseId: string; 
      categoryId: string; 
      data: Partial<CreateCustomCategoryData> 
    }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, categoryId }: { horseId: string; categoryId: string }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseLogKeys.customLogs(categoryId || ''),
    queryFn: async (): Promise<HorseCustomLog[]> => {
      if (!categoryId) return [];
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/placeholder/categories/${categoryId}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, categoryId, data }: { 
      horseId: string; 
      categoryId: string; 
      data: CreateLogData 
    }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/categories/${categoryId}/logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, logId, data }: { 
      horseId: string; 
      logId: string; 
      data: Partial<CreateLogData> 
    }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/custom-logs/${logId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update custom log: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (result, { horseId }) => {
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
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, logId, categoryId }: { 
      horseId: string; 
      logId: string; 
      categoryId: string; 
    }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${horseId}/custom-logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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