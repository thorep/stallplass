import { getPostHogServer } from '@/lib/posthog-server'

type CaptureApiErrorParams = {
  error: unknown
  context: string
  route: string
  method?: string
  distinctId?: string
} & Record<string, unknown>

export function captureApiError(params: CaptureApiErrorParams) {
  try {
    const { error, context, route, method, distinctId, ...props } = params
    const ph = getPostHogServer()
    ph.captureException(error, distinctId, {
      context,
      route,
      http_method: method,
      ...props,
    })
  } catch {
    // noop by design
  }
}

