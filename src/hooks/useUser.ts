import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

export function useProfile(profileId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      try {
        const token = await getIdToken();
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch profile');
        }
        
        return response.json();
      } catch (error) {
        throw error;
      }
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Legacy alias for backward compatibility during migration
export function useUser(userId: string | undefined) {
  return useProfile(userId);
}

export function useUpdateProfile() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: {
      firstname?: string;
      middlename?: string;
      lastname?: string;
      nickname?: string;
      phone?: string;
    }) => {
      const token = await getIdToken();
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch profile queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}