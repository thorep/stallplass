'use client';

import { useHypertune } from '../../generated/hypertune.react';

/**
 * Client-side hook to get the showCompressionInfoFrontend feature flag
 */
export function useCompressionFlag(): boolean {
  const hypertune = useHypertune();
  
  return hypertune.showCompressionInfoFrontend({ 
    fallback: false // Default to false if flag can't be loaded
  });
}