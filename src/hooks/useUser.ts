import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import type { Profile } from '@/types';

export function useProfile(profileId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery<Profile | null>({
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

  return useMutation<Profile, Error, {
    firstname?: string;
    middlename?: string;
    lastname?: string;
    nickname?: string;
    phone?: string;
    Adresse1?: string;
    Adresse2?: string;
    Postnummer?: string;
    Poststed?: string;
  }>({
    mutationFn: async (profileData) => {
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
        // Parse error response for better error handling
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = null;
          console.error('Failed to parse error response:', parseError);
        }
        
        console.error('Profile update failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          profileData
        });
        
        // Create error object with response data for client handling
        const error = new Error(errorData?.error || 'Failed to update profile') as Error & {
          response?: {
            status: number;
            data?: {
              error?: string;
              details?: Array<{ path?: string[]; message: string }>;
            };
          };
        };
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch profile queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}