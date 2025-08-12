import { PostHog } from 'posthog-node'

let posthogInstance: PostHog | null = null

// Mock PostHog interface for when PostHog is disabled
interface MockPostHog {
  captureException: (error: unknown, distinctId?: string, additionalProperties?: Record<string | number, unknown>) => void
  capture: (props: Record<string, unknown>) => void
  identify: (props: Record<string, unknown>) => void
  flush: () => Promise<void>
  shutdown: () => Promise<void>
}

export function getPostHogServer(): PostHog | MockPostHog {
  if (!posthogInstance) {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
    
    // Only initialize PostHog if we have the required environment variables
    if (!posthogKey) {
      console.warn('PostHog: NEXT_PUBLIC_POSTHOG_KEY is not defined. PostHog error tracking will be disabled.')
      // Return a mock PostHog instance that doesn't do anything
      return {
        captureException: () => {},
        capture: () => {},
        identify: () => {},
        flush: () => Promise.resolve(),
        shutdown: () => Promise.resolve(),
      }
    }
    
    posthogInstance = new PostHog(posthogKey, {
      host: posthogHost || 'https://us.i.posthog.com', // Default to US host if not specified
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogInstance
}