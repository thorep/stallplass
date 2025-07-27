'use client';

import type { 
  CreateStableData,
  UpdateStableData,
  StableSearchFilters
} from '@/types/services';
import type { StableWithAmenities, StableWithBoxStats } from '@/types/stable';

/**
 * Client-side stable service that calls API routes
 * This service runs in the browser and makes HTTP requests to our API
 */

const API_BASE = '/api/stables';

/**
 * Get all stables with optional filtering
 */
export async function getAllStables(filters?: StableSearchFilters): Promise<StableWithAmenities[]> {
  const searchParams = new URLSearchParams();
  
  if (filters) {
    if (filters.query) searchParams.set('query', filters.query);
    if (filters.location) searchParams.set('location', filters.location);
    if (filters.minPrice) searchParams.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) searchParams.set('maxPrice', filters.maxPrice.toString());
    if (filters.amenityIds?.length) searchParams.set('fasilitetIds', filters.amenityIds.join(','));
    if (filters.hasAvailableBoxes) searchParams.set('hasAvailableBoxes', 'true');
    if (filters.maxHorseSize) searchParams.set('max_horse_size', filters.maxHorseSize);
  }
  
  const url = searchParams.toString() ? `${API_BASE}?${searchParams}` : API_BASE;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stables: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get stables by owner with box statistics (requires authentication)
 */
export async function getStablesByOwner(ownerId: string): Promise<StableWithBoxStats[]> {
  const searchParams = new URLSearchParams({
    owner_id: ownerId,
    withBoxStats: 'true'
  });
  
  const response = await fetch(`${API_BASE}?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${await getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stables by owner: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get stable by ID
 */
export async function getStableById(id: string): Promise<StableWithAmenities> {
  const response = await fetch(`${API_BASE}/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Stable not found');
    }
    throw new Error(`Failed to fetch stable: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Create a new stable (requires authentication)
 */
export async function createStable(data: CreateStableData): Promise<StableWithAmenities> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create stable: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Update an existing stable (requires authentication)
 */
export async function updateStable(id: string, data: UpdateStableData): Promise<StableWithAmenities> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update stable: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Delete a stable (requires authentication)
 */
export async function deleteStable(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${await getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete stable: ${response.statusText}`);
  }
}

/**
 * Search stables with filters
 */
export async function searchStables(filters: StableSearchFilters): Promise<StableWithAmenities[]> {
  return getAllStables(filters);
}

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string> {
  // Import Supabase client dynamically to avoid server-side issues
  const { createClient } = await import('@/lib/supabase');
  const supabase = createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('Authentication required');
  }
  
  return session.access_token;
}