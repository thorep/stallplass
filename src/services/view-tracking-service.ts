import { EntityType } from '@/lib/supabase';

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
}

export async function trackView({ entityType, entityId, viewerId }: TrackViewParams): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Failed to track view:', error);
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
  const trackStableView = (stableId: string, viewerId?: string) => {
    trackView({
      entityType: EntityType.STABLE,
      entityId: stableId,
      viewerId,
    });
  };

  const trackBoxView = (boxId: string, viewerId?: string) => {
    trackView({
      entityType: EntityType.BOX,
      entityId: boxId,
      viewerId,
    });
  };

  return {
    trackStableView,
    trackBoxView,
  };
}