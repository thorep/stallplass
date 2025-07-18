import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Stable, Box, Conversation, Message, Rental } from '@prisma/client';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserStables = (userId: string) => {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['stables', 'user', userId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/stables?ownerId=${userId}&withBoxStats=true`, {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch user stables');
      return response.json() as Promise<Stable[]>;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
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
export const useBoxes = (stableId: string) => {
  return useQuery({
    queryKey: ['boxes', stableId],
    queryFn: async () => {
      const response = await fetch(`/api/stables/${stableId}/boxes`);
      if (!response.ok) throw new Error('Failed to fetch boxes');
      return response.json() as Promise<Box[]>;
    },
    enabled: !!stableId,
    staleTime: 5 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['boxes', newBox.stableId] });
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
      queryClient.invalidateQueries({ queryKey: ['boxes', updatedBox.stableId] });
      queryClient.invalidateQueries({ queryKey: ['stables'] });
    },
  });
};

export const useDeleteBox = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { id: string; stableId: string }) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/boxes/${data.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete box');
      return response.json();
    },
    onSuccess: (_, { stableId }) => {
      queryClient.invalidateQueries({ queryKey: ['boxes', stableId] });
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
    staleTime: 30 * 1000, // 30 seconds for messaging
    refetchInterval: 30 * 1000, // Poll every 30 seconds
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
    staleTime: 10 * 1000, // 10 seconds for real-time feel
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();
  
  return useMutation({
    mutationFn: async (data: { stableId: string; boxId?: string; initialMessage: string }) => {
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000, // 10 minutes
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
    staleTime: 10 * 60 * 1000, // 10 minutes
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};