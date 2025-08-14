import { useMemo } from 'react';
import { usePublicAdvertisementSettings } from './usePublicAdvertisementSettings';

interface AdvertisementInjectionOptions<T = unknown> {
  items: T[];
  enabled?: boolean;
}

interface AdvertisementInjectionResult {
  shouldShowAd: boolean;
  adPosition: number;
}

/**
 * Hook for determining if and where to show advertisements in a list
 * Handles the business logic for advertisement placement based on admin settings
 */
export function useAdvertisementInjection<T = unknown>({ 
  items, 
  enabled = true 
}: AdvertisementInjectionOptions<T>): AdvertisementInjectionResult {
  const { data: adSettings } = usePublicAdvertisementSettings();
  
  return useMemo(() => {
    // Don't show ads if disabled or no items
    if (!enabled || items.length === 0) {
      return { shouldShowAd: false, adPosition: -1 };
    }

    // Use settings from database or fallback to defaults
    const settings = adSettings || {
      advertisementChance: 50,
      advertisementMinPos: 1,
      advertisementMaxPos: 40,
    };
    
    // Check if we should show advertisement based on chance percentage
    const shouldShowAd = Math.random() * 100 < settings.advertisementChance;
    
    if (!shouldShowAd) {
      return { shouldShowAd: false, adPosition: -1 };
    }
    
    // Calculate position within the allowed range
    const minPos = Math.max(0, settings.advertisementMinPos - 1); // Convert to 0-based index
    const maxPos = Math.min(settings.advertisementMaxPos - 1, items.length); // Convert to 0-based index
    const adPosition = Math.floor(Math.random() * (maxPos - minPos + 1)) + minPos;
    
    return { shouldShowAd: true, adPosition };
  }, [items.length, adSettings, enabled]);
}