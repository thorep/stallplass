import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/supabase-auth-context";

export interface BoxAdvertisingInfo {
  isActive: boolean;
  advertisingEndDate: Date | null;
  daysRemaining: number;
}

/**
 * Get advertising info for a specific box
 */
export function useGetBoxAdvertisingInfo(boxId: string | undefined) {
  const { getIdToken } = useAuth();
  
  return useQuery({
    queryKey: ['box-advertising', boxId],
    queryFn: async (): Promise<BoxAdvertisingInfo | null> => {
      if (!boxId) return null;
      
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${boxId}/advertising`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch box advertising info: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Convert date string to Date object
      return {
        ...data,
        advertisingEndDate: data.advertisingEndDate ? new Date(data.advertisingEndDate) : null
      };
    },
    enabled: !!boxId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Purchase advertising for a box
 */
export function usePurchaseBoxAdvertising() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      boxId,
      months,
      invoiceData
    }: {
      boxId: string;
      months: number;
      invoiceData: {
        fullName: string;
        address: string;
        postalCode: string;
        city: string;
        phone: string;
        email: string;
        amount: number;
        discount: number;
        description: string;
      };
    }) => {
      const token = await getIdToken();
      const response = await fetch('/api/invoice-requests/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...invoiceData,
          itemType: 'BOX_ADVERTISING',
          boxId,
          months
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to purchase box advertising: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['box-advertising', variables.boxId] });
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-requests'] });
    }
  });
}