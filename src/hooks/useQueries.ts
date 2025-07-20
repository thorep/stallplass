import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Stable, Box, BasePrice } from '@/types';
import { StableWithBoxStats } from '@/types/stable';
import { Conversation, Message, Rental } from '@/types/conversations';
import { QUERY_STALE_TIMES, POLLING_INTERVALS } from '@/utils';

// Helper function to get auth headers
const useAuthHeaders = () => {
  const { user } = useAuth();
  
  const getAuthHeaders = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  
  return getAuthHeaders;
};

// Stable Queries
export const useStables = (filters?: Record<string, unknown>) => {
  const queryKey = ['stables', filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(`/api/stables?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stables');
      return response.json() as Promise<Stable[]>;
    },
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

export const useUserStables = (userId: string) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['stables', 'user', userId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/stables?owner_id=${userId}&withBoxStats=true`, {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch user stables');
      return response.json() as Promise<StableWithBoxStats[]>;
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

export const useCreateStable = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<Stable>) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/stables', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create stable');
      return response.json() as Promise<Stable>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['stables', 'user'] });
    },
  });
};

export const useUpdateStable = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<Stable> & { id: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/stables/${data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update stable');
      return response.json() as Promise<Stable>;
    },
    onSuccess: (updatedStable) => {
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['stables', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['stable', updatedStable.id] });
    },
  });
};

export const useDeleteStable = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/stables/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete stable');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['stables', 'user'] });
    },
  });
};

// Box Queries
export const useBoxes = (stable_id: string) => {
  return useQuery({
    queryKey: ['boxes', stable_id],
    queryFn: async () => {
      const response = await fetch(`/api/stables/${stable_id}/boxes`);
      if (!response.ok) throw new Error('Failed to fetch boxes');
      return response.json() as Promise<Box[]>;
    },
    enabled: !!stable_id,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

export const useCreateBox = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<Box>) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/boxes', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create box');
      return response.json() as Promise<Box>;
    },
    onSuccess: (newBox) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', newBox.stable_id] });
      queryClient.invalidateQueries({ queryKey: ['stables'] });
    },
  });
};

export const useUpdateBox = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: Partial<Box> & { id: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/boxes/${data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update box');
      return response.json() as Promise<Box>;
    },
    onSuccess: (updatedBox) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', updatedBox.stable_id] });
      queryClient.invalidateQueries({ queryKey: ['stables'] });
    },
  });
};

export const useDeleteBox = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; stable_id: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/boxes/${data.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete box');
      return response.json();
    },
    onSuccess: (_, { stable_id }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', stable_id] });
      queryClient.invalidateQueries({ queryKey: ['stables'] });
    },
  });
};

// Conversation Queries
export const useConversations = (userId: string) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/conversations`, {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json() as Promise<Conversation[]>;
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.MESSAGING,
    refetchInterval: POLLING_INTERVALS.CONVERSATIONS,
  });
};

export const useMessages = (conversationId: string) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json() as Promise<Message[]>;
    },
    enabled: !!conversationId,
    staleTime: QUERY_STALE_TIMES.REAL_TIME_MESSAGES,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { stable_id: string; boxId?: string; initialMessage: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json() as Promise<Conversation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { conversationId: string; content: string; messageType?: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/conversations/${data.conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json() as Promise<Message>;
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', newMessage.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

// Rental Queries
export const useRentals = (userId: string) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['rentals', userId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/rentals`, {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch rentals');
      return response.json() as Promise<Rental[]>;
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

export const useConfirmRental = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { conversationId: string; startDate: string; endDate?: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/conversations/${data.conversationId}/confirm-rental`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to confirm rental');
      return response.json() as Promise<Rental>;
    },
    onSuccess: (rental) => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', rental.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
    },
  });
};

// Amenity Queries
export const useStableAmenities = () => {
  return useQuery({
    queryKey: ['amenities', 'stable'],
    queryFn: async () => {
      const response = await fetch('/api/stable-amenities');
      if (!response.ok) throw new Error('Failed to fetch stable amenities');
      return response.json();
    },
    staleTime: QUERY_STALE_TIMES.AMENITIES,
  });
};

export const useBoxAmenities = () => {
  return useQuery({
    queryKey: ['amenities', 'box'],
    queryFn: async () => {
      const response = await fetch('/api/box-amenities');
      if (!response.ok) throw new Error('Failed to fetch box amenities');
      return response.json();
    },
    staleTime: QUERY_STALE_TIMES.AMENITIES,
  });
};

// User Queries
export const useCurrentUser = (userId: string) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/user', {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json() as Promise<{ id: string; name: string; email: string; firebaseId: string; isAdmin: boolean }>;
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

// Sponsored Placement Queries and Mutations
export const useSponsoredPlacementInfo = (boxId: string, enabled = true) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['sponsored-placement-info', boxId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/boxes/${boxId}/sponsored`, {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch sponsored placement info');
      return response.json() as Promise<{
        is_sponsored: boolean;
        sponsoredUntil: Date | null;
        daysRemaining: number;
        maxDaysAvailable: number;
      }>;
    },
    enabled: enabled && !!boxId,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

export const usePurchaseSponsoredPlacement = () => {
  const getAuthHeaders = useAuthHeaders();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ boxId, days }: { boxId: string; days: number }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/boxes/${boxId}/sponsored`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ days }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to purchase sponsored placement');
      }
      return response.json();
    },
    onSuccess: (_, { boxId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['sponsored-placement-info', boxId] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      queryClient.invalidateQueries({ queryKey: ['stables'] });
    },
  });
};

// Pricing Queries
export const useBasePrice = () => {
  return useQuery({
    queryKey: ['pricing', 'base'],
    queryFn: async () => {
      const response = await fetch('/api/pricing/base');
      if (!response.ok) throw new Error('Failed to fetch base price');
      return response.json() as Promise<BasePrice>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Review Queries
export const useReviews = (filters?: { stable_id?: string; revieweeId?: string; revieweeType?: string }) => {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(`/api/reviews?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

export const useReviewableRentals = (userId: string) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['reviews', 'rentals', userId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/reviews/rentals', {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch reviewable rentals');
      return response.json();
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: {
      rentalId: string;
      revieweeId: string;
      revieweeType: string;
      stable_id: string;
      rating: number;
      title?: string;
      comment?: string;
      communicationRating?: number;
      cleanlinessRating?: number;
      facilitiesRating?: number;
      reliabilityRating?: number;
    }) => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create review');
      }
      return response.json();
    },
    onSuccess: (newReview) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'rentals'] });
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['stable', newReview.stable_id] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: {
      id: string;
      rating?: number;
      title?: string;
      comment?: string;
      communicationRating?: number;
      cleanlinessRating?: number;
      facilitiesRating?: number;
      reliabilityRating?: number;
    }) => {
      const headers = await getAuthHeaders();
      const { id, ...updateData } = data;
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update review');
      }
      return response.json();
    },
    onSuccess: (updatedReview) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'rentals'] });
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['stable', updatedReview.stable_id] });
    },
  });
};