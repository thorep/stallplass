import { useQuery } from '@tanstack/react-query';
import type { users } from '@/generated/prisma';

async function fetchUserById(userId: string): Promise<users | null> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}