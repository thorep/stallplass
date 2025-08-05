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

// Query key factories
export const horseLogKeys = {
  all: ['horse-logs'] as const,
  careLogs: (horseId: string) => [...horseLogKeys.all, 'care', horseId] as const,
  exerciseLogs: (horseId: string) => [...horseLogKeys.all, 'exercise', horseId] as const,
  feedingLogs: (horseId: string) => [...horseLogKeys.all, 'feeding', horseId] as const,
  medicalLogs: (horseId: string) => [...horseLogKeys.all, 'medical', horseId] as const,
  otherLogs: (horseId: string) => [...horseLogKeys.all, 'other', horseId] as const,
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