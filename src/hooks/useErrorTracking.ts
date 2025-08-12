import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export function useErrorTracking() {
  const posthog = usePostHog();

  const captureError = useCallback((
    error: Error | unknown,
    context?: {
      component?: string;
      action?: string;
      userId?: string;
      additionalData?: Record<string, unknown>;
    }
  ) => {
    if (!posthog) return;

    // Convert unknown errors to Error objects
    const errorObj = error instanceof Error ? error : new Error(String(error));

    posthog.captureException(errorObj, {
      source: 'manual-capture',
      component: context?.component,
      action: context?.action,
      user_id: context?.userId,
      ...context?.additionalData,
    });
  }, [posthog]);

  const captureErrorWithMessage = useCallback((
    message: string,
    context?: {
      component?: string;
      action?: string;
      userId?: string;
      additionalData?: Record<string, unknown>;
    }
  ) => {
    captureError(new Error(message), context);
  }, [captureError]);

  return {
    captureError,
    captureErrorWithMessage,
  };
}