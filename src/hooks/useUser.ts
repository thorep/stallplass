import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

export function useUser(userId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      try {
        const token = await getIdToken();
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch user');
        }
        
        return response.json();
      } catch (error) {
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}