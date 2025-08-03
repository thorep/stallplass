import { useQuery } from '@tanstack/react-query';

interface PriceRanges {
  boxes: {
    min: number;
    max: number;
  };
  stables: {
    min: number;
    max: number;
  };
}

async function fetchPriceRanges(): Promise<PriceRanges> {
  const response = await fetch('/api/search/price-ranges');
  if (!response.ok) {
    throw new Error('Failed to fetch price ranges');
  }
  return response.json();
}

export function usePriceRanges() {
  return useQuery({
    queryKey: ['price-ranges'],
    queryFn: fetchPriceRanges,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
  });
}