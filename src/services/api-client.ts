'use client';

import { StableWithBoxStats, StableWithAmenities, StableSearchFilters } from '@/types/stable';
import { BoxWithStablePreview } from '@/types/stable';
import { BoxFilters } from '@/services/box-service';

/**
 * Client-side API service for fetching data from Next.js API routes
 * This prevents client components from importing server-side services
 */

export const apiClient = {
  // Stable API calls
  stables: {
    async getAll(): Promise<StableWithAmenities[]> {
      const response = await fetch('/api/stables');
      if (!response.ok) throw new Error('Failed to fetch stables');
      return response.json();
    },

    async getAllWithBoxStats(): Promise<StableWithBoxStats[]> {
      const response = await fetch('/api/stables?withBoxStats=true');
      if (!response.ok) throw new Error('Failed to fetch stables with box stats');
      return response.json();
    },

    async getByOwner(ownerId: string): Promise<StableWithAmenities[]> {
      const response = await fetch(`/api/stables?owner_id=${ownerId}`);
      if (!response.ok) throw new Error('Failed to fetch stables by owner');
      return response.json();
    },

    async search(filters: StableSearchFilters = {}): Promise<StableWithAmenities[]> {
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.location) params.append('location', filters.location);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.amenityIds && filters.amenityIds.length > 0) params.append('amenityIds', filters.amenityIds.join(','));
      if (filters.hasAvailableBoxes !== undefined) params.append('hasAvailableBoxes', filters.hasAvailableBoxes.toString());

      const response = await fetch(`/api/stables?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to search stables');
      return response.json();
    }
  },

  // Box API calls
  boxes: {
    async search(filters: BoxFilters = {}): Promise<BoxWithStablePreview[]> {
      const params = new URLSearchParams();
      if (filters.stableId) params.append('stable_id', filters.stableId);
      if (filters.isAvailable !== undefined) params.append('is_available', filters.isAvailable.toString());
      if (filters.occupancyStatus) params.append('occupancyStatus', filters.occupancyStatus);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.amenityIds && filters.amenityIds.length > 0) params.append('amenityIds', filters.amenityIds.join(','));
      if (filters.fylkeId) params.append('fylkeId', filters.fylkeId);
      if (filters.kommuneId) params.append('kommuneId', filters.kommuneId);

      const response = await fetch(`/api/boxes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to search boxes');
      return response.json();
    }
  }
};

// Legacy exports for backwards compatibility
export const { stables, boxes } = apiClient;