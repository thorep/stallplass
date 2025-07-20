import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { RoadmapItem, BasePrice, PricingDiscount, StableAmenity, BoxAmenity } from '@/types';

// Helper function to get auth headers
const useAuthHeaders = () => {
  const { user, getIdToken } = useAuth();
  
  const getAuthHeaders = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  
  return getAuthHeaders;
};

// Roadmap Queries
export const useAdminRoadmapItems = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'roadmap'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/roadmap', { headers });
      if (!response.ok) throw new Error('Failed to fetch roadmap items');
      return response.json() as Promise<RoadmapItem[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateRoadmapItem = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<RoadmapItem>) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/roadmap', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create roadmap item');
      return response.json() as Promise<RoadmapItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roadmap'] });
    },
  });
};

export const useUpdateRoadmapItem = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<RoadmapItem> & { id: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/roadmap', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update roadmap item');
      return response.json() as Promise<RoadmapItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roadmap'] });
    },
  });
};

export const useDeleteRoadmapItem = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/roadmap?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete roadmap item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roadmap'] });
    },
  });
};

// Amenities Queries
export const useAdminStableAmenities = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'amenities', 'stable'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/stable', { headers });
      if (!response.ok) throw new Error('Failed to fetch stable amenities');
      return response.json() as Promise<StableAmenity[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminBoxAmenities = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'amenities', 'box'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/box', { headers });
      if (!response.ok) throw new Error('Failed to fetch box amenities');
      return response.json() as Promise<BoxAmenity[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateStableAmenity = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/stable', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create stable amenity');
      return response.json() as Promise<StableAmenity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'stable'] });
    },
  });
};

export const useUpdateStableAmenity = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/stable', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update stable amenity');
      return response.json() as Promise<StableAmenity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'stable'] });
    },
  });
};

export const useDeleteStableAmenity = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/amenities/stable?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete stable amenity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'stable'] });
    },
  });
};

export const useCreateBoxAmenity = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/box', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create box amenity');
      return response.json() as Promise<BoxAmenity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'box'] });
    },
  });
};

export const useUpdateBoxAmenity = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/box', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update box amenity');
      return response.json() as Promise<BoxAmenity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'box'] });
    },
  });
};

export const useDeleteBoxAmenity = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/amenities/box?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete box amenity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'box'] });
    },
  });
};

// Pricing Queries
export const useAdminBasePrice = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'pricing', 'base'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/base', { headers });
      if (!response.ok) throw new Error('Failed to fetch base price');
      return response.json() as Promise<BasePrice>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateBasePrice = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { price: number; description?: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/base', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update base price');
      return response.json() as Promise<BasePrice>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing', 'base'] });
    },
  });
};

export const useAdminDiscounts = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'pricing', 'discounts'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/discounts', { headers });
      if (!response.ok) throw new Error('Failed to fetch discounts');
      return response.json() as Promise<PricingDiscount[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { months: number; percentage: number; isActive?: boolean }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/discounts', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create discount');
      return response.json() as Promise<PricingDiscount>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing', 'discounts'] });
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; months: number; percentage: number; isActive: boolean }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/discounts', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update discount');
      return response.json() as Promise<PricingDiscount>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing', 'discounts'] });
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/pricing/discounts?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete discount');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing', 'discounts'] });
    },
  });
};

// User Management Queries
export const useAdminUsers = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/users', { headers });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateUserAdmin = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; isAdmin: boolean }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// Stable Management Queries
export const useAdminStables = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'stables'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/stables', { headers });
      if (!response.ok) throw new Error('Failed to fetch stables');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateStableAdmin = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; featured: boolean }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/stables', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update stable');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stables'] });
    },
  });
};

export const useDeleteStableAdmin = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/stables?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete stable');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stables'] });
    },
  });
};

// Box Management Queries
export const useAdminBoxes = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'boxes'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/boxes', { headers });
      if (!response.ok) throw new Error('Failed to fetch boxes');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateBoxAdmin = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; isActive?: boolean; isAvailable?: boolean }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/boxes', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update box');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boxes'] });
    },
  });
};

export const useDeleteBoxAdmin = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/boxes?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete box');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boxes'] });
    },
  });
};

// Payment Management Queries
export const useAdminPayments = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/payments', { headers });
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};