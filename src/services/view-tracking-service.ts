import type { EntityType } from '@/generated/prisma';
import { useCallback } from 'react';

export interface TrackViewParams {
  entityType: EntityType;
  entityId: string;
  viewerId?: string;
}

export interface ViewAnalytics {
  entityId?: string;
  entityType?: EntityType;
  totalViews: number;
  viewsByDay?: Array<{
    date: string;
    views: number;
  }>;
  summary?: {
    totalStableViews: number;
    totalBoxViews: number;
    totalServiceViews: number;
    totalViews: number;
  };
  stables?: Array<{
    stableId: string;
    stableName: string;
    views: number;
  }>;
  boxes?: Array<{
    boxId: string;
    boxName: string;
    stableName: string;
    views: number;
  }>;
  services?: Array<{
    serviceId: string;
    serviceName: string;
    serviceType: string;
    views: number;
  }>;
}

// Simple cache to prevent duplicate view tracking calls within 5 seconds
const viewCache = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5000;

// Get or create a session-based anonymous profile ID
function getAnonymousProfileId(): string {
  if (typeof window === 'undefined') return 'ssr'; // Server-side rendering
  
  let anonymousId = sessionStorage.getItem('anonymous-profile-id');
  if (!anonymousId) {
    anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('anonymous-profile-id', anonymousId);
  }
  return anonymousId;
}

export async function trackView({ entityType, entityId, viewerId }: TrackViewParams): Promise<void> {
  // Create a unique key for this view tracking call
  // For anonymous profiles, use a session-based ID so each browser session is unique
  const profileKey = viewerId || getAnonymousProfileId();
  const cacheKey = `${entityType}:${entityId}:${profileKey}`;
  const now = Date.now();
  
  // Check if we've already tracked this view recently
  const lastTracked = viewCache.get(cacheKey);
  if (lastTracked && (now - lastTracked) < DEDUPE_WINDOW_MS) {
    // Duplicate view tracking prevented - silently skip
    return; // Skip duplicate call
  }
  
  // Update cache with current timestamp
  viewCache.set(cacheKey, now);
  
  try {
    console.log(`📊 Tracking view: ${entityType} ${entityId}`);
    await fetch('/api/page-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityType,
        entityId,
        viewerId,
      }),
    });
  } catch {
    // Silently fail - view tracking shouldn't break the user experience
  }
}

export async function getViewAnalytics(
  ownerId: string,
  options?: {
    entityType?: EntityType;
    entityId?: string;
    days?: number;
  }
): Promise<ViewAnalytics> {
  const params = new URLSearchParams({ ownerId });
  
  if (options?.entityType) {
    params.append('entityType', options.entityType);
  }
  if (options?.entityId) {
    params.append('entityId', options.entityId);
  }
  if (options?.days) {
    params.append('days', options.days.toString());
  }

  const response = await fetch(`/api/analytics/views?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch view analytics');
  }
  
  return response.json();
}

// Hook for React components to track views
export function useViewTracking() {
  const trackStableView = useCallback((stableId: string, viewerId?: string) => {
    trackView({
      entityType: 'STABLE',
      entityId: stableId,
      viewerId,
    });
  }, []);

  const trackBoxView = useCallback((boxId: string, viewerId?: string) => {
    trackView({
      entityType: 'BOX',
      entityId: boxId,
      viewerId,
    });
  }, []);

  const trackServiceView = useCallback((serviceId: string, viewerId?: string) => {
    trackView({
      entityType: 'SERVICE',
      entityId: serviceId,
      viewerId,
    });
  }, []);

  const trackPartLoanHorseView = useCallback((partLoanHorseId: string, viewerId?: string) => {
    trackView({
      entityType: 'PART_LOAN_HORSE',
      entityId: partLoanHorseId,
      viewerId,
    });
  }, []);

  return {
    trackStableView,
    trackBoxView,
    trackServiceView,
    trackPartLoanHorseView,
  };
}