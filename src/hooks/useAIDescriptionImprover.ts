import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRef, useEffect, useState } from 'react';
import { getAiWaitTimeFlag } from '@/app/actions/flags';

interface ImproveDescriptionRequest {
  description: string;
}

interface ImproveDescriptionResponse {
  improvedDescription: string;
  originalDescription: string;
}

export function useImproveDescription() {
  const { getIdToken } = useAuth();
  const lastUsedRef = useRef<number>(0);
  const [waitTimeSeconds, setWaitTimeSeconds] = useState(10); // Default fallback
  const [remainingWaitTime, setRemainingWaitTime] = useState(0); // Remaining wait time in seconds
  
  useEffect(() => {
    const fetchWaitTime = async () => {
      try {
        const timeFromHypertune = await getAiWaitTimeFlag();
        setWaitTimeSeconds(timeFromHypertune || 10);
      } catch (error) {
        console.warn('Failed to fetch AI wait time from Hypertune, using default:', error);
        setWaitTimeSeconds(10);
      }
    };
    
    fetchWaitTime();
  }, []);
  
  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUse = now - lastUsedRef.current;
      const WAIT_TIME_MS = waitTimeSeconds * 1000;
      
      if (timeSinceLastUse < WAIT_TIME_MS) {
        const remainingMs = WAIT_TIME_MS - timeSinceLastUse;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setRemainingWaitTime(remainingSeconds);
      } else {
        setRemainingWaitTime(0);
      }
    }, 100); // Update every 100ms for smooth countdown
    
    return () => clearInterval(interval);
  }, [waitTimeSeconds]);
  
  const WAIT_TIME_MS = waitTimeSeconds * 1000;
  
  const mutation = useMutation<ImproveDescriptionResponse, Error, ImproveDescriptionRequest>({
    mutationFn: async ({ description }) => {
      // Check rate limiting
      const now = Date.now();
      const timeSinceLastUse = now - lastUsedRef.current;
      
      if (timeSinceLastUse < WAIT_TIME_MS) {
        const waitTimeSeconds = Math.ceil((WAIT_TIME_MS - timeSinceLastUse) / 1000);
        throw new Error(`Vennligst vent ${waitTimeSeconds} sekunder før du bruker AI igjen.`);
      }
      
      lastUsedRef.current = now;
      
      const token = await getIdToken();
      const response = await fetch('/api/ai/improve-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to improve description');
      }

      return response.json();
    },
    throwOnError: false,
  });
  
  return {
    ...mutation,
    remainingWaitTime,
    isWaiting: remainingWaitTime > 0
  };
}