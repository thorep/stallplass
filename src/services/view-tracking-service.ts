import type { EntityType } from '@/generated/prisma';
import { useCallback } from 'react';

export interface TrackViewParams {
  entityType: EntityType;
  entityId: string;
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
    totalPartLoanHorseViews: number;
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
    serviceTypeDisplayName?: string;
    views: number;
  }>;
  partLoanHorses?: Array<{
    partLoanHorseId: string;
    partLoanHorseName: string;
    views: number;
  }>;
  horseSales?: Array<{
    horseSaleId: string;
    horseSaleName: string;
    views: number;
  }>;
  horseBuys?: Array<{
    horseBuyId: string;
    horseBuyName: string;
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

export async function trackView({ entityType, entityId }: TrackViewParams): Promise<void> {
  // Create a unique key for this view tracking call
  // For anonymous profiles, use a session-based ID so each browser session is unique
  const profileKey = getAnonymousProfileId();
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
    // Fire-and-forget; do not block caller
    void fetch('/api/page-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityType,
        entityId,
      }),
    }).catch((err) => {
      // Capture error in PostHog if available; otherwise console
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ph = (globalThis as any)?.posthog;
        if (ph && typeof ph.capture === 'function') {
          ph.capture('view_tracking_failed', { entityType, entityId, message: err?.message || 'unknown' });
        } else {
          console.warn('View tracking failed', entityType, entityId, err);
        }
      } catch {}
    });
  } catch (err) {
    // Final safety net; never throw
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ph = (globalThis as any)?.posthog;
      if (ph && typeof ph.capture === 'function') {
        ph.capture('view_tracking_failed', { entityType, entityId, message: (err as Error)?.message || 'unknown' });
      }
    } catch {}
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
  const trackStableView = useCallback((stableId: string) => {
    trackView({ entityType: 'STABLE', entityId: stableId });
  }, []);

  const trackBoxView = useCallback((boxId: string) => {
    trackView({ entityType: 'BOX', entityId: boxId });
  }, []);

  const trackServiceView = useCallback((serviceId: string) => {
    trackView({ entityType: 'SERVICE', entityId: serviceId });
  }, []);

  const trackPartLoanHorseView = useCallback((partLoanHorseId: string) => {
    trackView({ entityType: 'PART_LOAN_HORSE', entityId: partLoanHorseId });
  }, []);

  const trackHorseSaleView = useCallback((horseSaleId: string) => {
    trackView({ entityType: 'HORSE_SALE', entityId: horseSaleId });
  }, []);

  const trackHorseBuyView = useCallback((horseBuyId: string) => {
    trackView({ entityType: 'HORSE_BUY', entityId: horseBuyId });
  }, []);

  return {
    trackStableView,
    trackBoxView,
    trackServiceView,
    trackPartLoanHorseView,
    trackHorseSaleView,
    trackHorseBuyView,
  };
}
