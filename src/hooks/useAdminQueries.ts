import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { RoadmapItem, BasePrice, PricingDiscount, StableAmenity, BoxAmenity } from '@/types';

// Norwegian terminology aliases
type Veikartoppgave = RoadmapItem;
type GrunnPris = BasePrice;
type PrisRabatt = PricingDiscount;
type StallFasilitet = StableAmenity;
type StallplassFasilitet = BoxAmenity;

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

// Veikart-spørringer (Roadmap Queries)
export const useAdminVeikartoppgaver = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'veikart'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/roadmap', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente veikartoppgaver');
      return response.json() as Promise<Veikartoppgave[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Legacy wrapper for backward compatibility
export const useAdminRoadmapItems = useAdminVeikartoppgaver;

export const useOpprettVeikartoppgave = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<Veikartoppgave>) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/roadmap', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Kunne ikke opprette veikartoppgave');
      return response.json() as Promise<Veikartoppgave>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'veikart'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'roadmap'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useCreateRoadmapItem = useOpprettVeikartoppgave;

export const useOppdaterVeikartoppgave = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<Veikartoppgave> & { id: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/roadmap', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Kunne ikke oppdatere veikartoppgave');
      return response.json() as Promise<Veikartoppgave>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'veikart'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'roadmap'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useUpdateRoadmapItem = useOppdaterVeikartoppgave;

export const useSlettVeikartoppgave = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/roadmap?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Kunne ikke slette veikartoppgave');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'veikart'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'roadmap'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useDeleteRoadmapItem = useSlettVeikartoppgave;

// Fasilitets-spørringer (Amenities Queries)
export const useAdminStallFasiliteter = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'fasiliteter', 'stall'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/stable', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente stallfasiliteter');
      return response.json() as Promise<StallFasilitet[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminStableAmenities = useAdminStallFasiliteter;

export const useAdminStallplassFasiliteter = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'fasiliteter', 'stallplass'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/amenities/box', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente stallplassfasiliteter');
      return response.json() as Promise<StallplassFasilitet[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminBoxAmenities = useAdminStallplassFasiliteter;

export const useOpprettStallFasilitet = () => {
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
      if (!response.ok) throw new Error('Kunne ikke opprette stallfasilitet');
      return response.json() as Promise<StallFasilitet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fasiliteter', 'stall'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'stable'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useCreateStableAmenity = useOpprettStallFasilitet;

export const useOppdaterStallFasilitet = () => {
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
      if (!response.ok) throw new Error('Kunne ikke oppdatere stallfasilitet');
      return response.json() as Promise<StallFasilitet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fasiliteter', 'stall'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'stable'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useUpdateStableAmenity = useOppdaterStallFasilitet;

export const useSlettStallFasilitet = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/amenities/stable?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Kunne ikke slette stallfasilitet');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fasiliteter', 'stall'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'stable'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useDeleteStableAmenity = useSlettStallFasilitet;

export const useOpprettStallplassFasilitet = () => {
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
      if (!response.ok) throw new Error('Kunne ikke opprette stallplassfasilitet');
      return response.json() as Promise<StallplassFasilitet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fasiliteter', 'stallplass'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'box'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useCreateBoxAmenity = useOpprettStallplassFasilitet;

export const useOppdaterStallplassFasilitet = () => {
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
      if (!response.ok) throw new Error('Kunne ikke oppdatere stallplassfasilitet');
      return response.json() as Promise<StallplassFasilitet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fasiliteter', 'stallplass'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'box'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useUpdateBoxAmenity = useOppdaterStallplassFasilitet;

export const useSlettStallplassFasilitet = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/amenities/box?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Kunne ikke slette stallplassfasilitet');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fasiliteter', 'stallplass'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'amenities', 'box'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useDeleteBoxAmenity = useSlettStallplassFasilitet;

// Prisingsspørringer (Pricing Queries)
export const useAdminGrunnPris = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'prising', 'grunn'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/base', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente price');
      return response.json() as Promise<GrunnPris>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminBasePrice = useAdminGrunnPris;

export const useOppdaterGrunnPris = () => {
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
      if (!response.ok) throw new Error('Kunne ikke oppdatere price');
      return response.json() as Promise<GrunnPris>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'prising', 'grunn'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing', 'base'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useUpdateBasePrice = useOppdaterGrunnPris;

export const useAdminRabatter = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'prising', 'rabatter'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/pricing/discounts', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente rabatter');
      return response.json() as Promise<PrisRabatt[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminDiscounts = useAdminRabatter;

export const useOpprettRabatt = () => {
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
      if (!response.ok) throw new Error('Kunne ikke opprette rabatt');
      return response.json() as Promise<PrisRabatt>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'prising', 'rabatter'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing', 'discounts'] }); // Legacy support
    },
  });
};

// Legacy wrapper
export const useCreateDiscount = useOpprettRabatt;

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

// Brukerbehandling-spørringer (User Management Queries)
export const useAdminBrukere = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/users', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente users');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminUsers = useAdminBrukere;

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

// Stallbehandling-spørringer (Stable Management Queries)
export const useAdminStaller = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'stables'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/stables', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente stables');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminStables = useAdminStaller;

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

// Stallplassbehandling-spørringer (Box Management Queries)
export const useAdminStallplasser = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'boxes'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/boxes', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente boxes');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminBoxes = useAdminStallplasser;

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

// Betalingsbehandling-spørringer (Payment Management Queries)
export const useAdminBetalinger = () => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/payments', { headers });
      if (!response.ok) throw new Error('Kunne ikke hente betalinger');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Legacy wrapper
export const useAdminPayments = useAdminBetalinger;