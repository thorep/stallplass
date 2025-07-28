import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger, logger } from './logger';

export type ApiHandler = (req: NextRequest, context?: unknown) => Promise<NextResponse>;

/**
 * Middleware that adds comprehensive logging to API endpoints
 * - Logs all incoming requests with timing
 * - Logs response status and duration  
 * - Logs errors with full context
 * - Creates request-scoped logger with unique ID
 */
export function withApiLogging<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options?: {
    skipRequestLogging?: boolean;
    skipResponseLogging?: boolean;
    logBody?: boolean; // Only in development
  }
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const { pathname } = new URL(req.url);
    
    // Create request-scoped logger
    const apiLogger = createApiLogger({
      endpoint: pathname,
      method: req.method,
      requestId,
    });

    // Log incoming request
    if (!options?.skipRequestLogging) {
      const logData: Record<string, unknown> = {
        req: {
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
        },
      };

      // Log request body in development (be careful with sensitive data)
      if (options?.logBody && process.env.NODE_ENV !== 'production') {
        try {
          if (req.headers.get('content-type')?.includes('application/json')) {
            const body = await req.clone().json();
            logData.body = body;
          }
        } catch {
          // Ignore body parsing errors
        }
      }

      apiLogger.info(logData, `→ ${req.method} ${pathname}`);
    }

    try {
      // Execute the handler
      const response = await handler(req, ...args);
      const duration = Date.now() - start;

      // Log successful response
      if (!options?.skipResponseLogging) {
        apiLogger.info({
          res: {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          },
          duration,
        }, `← ${response.status} ${req.method} ${pathname} (${duration}ms)`);
      }

      return response;

    } catch (error) {
      const duration = Date.now() - start;
      
      // Log error with full context
      apiLogger.error({
        err: error,
        req: {
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
        },
        duration,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      }, `✗ ERROR ${req.method} ${pathname} (${duration}ms): ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Re-throw to let Next.js handle the error response
      throw error;
    }
  };
}

/**
 * Middleware for authenticated API endpoints that includes user context
 */
export function withAuthenticatedApiLogging<T extends unknown[]>(
  handler: (req: NextRequest, context: { userId: string }, ...args: T) => Promise<NextResponse>,
  options?: {
    skipRequestLogging?: boolean;
    skipResponseLogging?: boolean;
    logBody?: boolean;
  }
) {
  return async (req: NextRequest, context: { userId: string }, ...args: T): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const { pathname } = new URL(req.url);
    
    // Create request-scoped logger with user context
    const apiLogger = createApiLogger({
      endpoint: pathname,
      method: req.method,
      requestId,
      userId: context.userId,
    });

    // Log incoming request with user context
    if (!options?.skipRequestLogging) {
      const logData: Record<string, unknown> = {
        req: {
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
        },
        user: { id: context.userId },
      };

      // Log request body in development
      if (options?.logBody && process.env.NODE_ENV !== 'production') {
        try {
          if (req.headers.get('content-type')?.includes('application/json')) {
            const body = await req.clone().json();
            logData.body = body;
          }
        } catch {
          // Ignore body parsing errors
        }
      }

      apiLogger.info(logData, `→ ${req.method} ${pathname} [User: ${context.userId}]`);
    }

    try {
      // Execute the handler
      const response = await handler(req, context, ...args);
      const duration = Date.now() - start;

      // Log successful response
      if (!options?.skipResponseLogging) {
        apiLogger.info({
          res: {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          },
          user: { id: context.userId },
          duration,
        }, `← ${response.status} ${req.method} ${pathname} [User: ${context.userId}] (${duration}ms)`);
      }

      return response;

    } catch (error) {
      const duration = Date.now() - start;
      
      // Log error with user and full context
      apiLogger.error({
        err: error,
        req: {
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
        },
        user: { id: context.userId },
        duration,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      }, `✗ ERROR ${req.method} ${pathname} [User: ${context.userId}] (${duration}ms): ${error instanceof Error ? error.message : 'Unknown error'}`);

      throw error;
    }
  };
}

/**
 * Simple error logger for catch blocks
 */
export function logApiError(
  error: unknown, 
  context: {
    endpoint: string;
    method: string;
    userId?: string;
    requestId?: string;
    additionalContext?: Record<string, unknown>;
  }
) {
  const apiLogger = createApiLogger({
    endpoint: context.endpoint,
    method: context.method,
    requestId: context.requestId,
    userId: context.userId,
  });

  apiLogger.error({
    err: error,
    ...context.additionalContext,
    errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
  }, `API Error in ${context.method} ${context.endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

/**
 * Business logic logger for important operations
 */
export function logBusinessOperation(
  operation: string,
  result: 'success' | 'failure',
  context: {
    userId?: string;
    resourceId?: string;
    resourceType?: string;
    details?: Record<string, unknown>;
    duration?: number;
  }
) {
  const level = result === 'success' ? 'info' : 'warn';
  const emoji = result === 'success' ? '✅' : '⚠️';
  
  logger[level]({
    operation,
    result,
    userId: context.userId,
    resourceId: context.resourceId,
    resourceType: context.resourceType,
    duration: context.duration,
    ...context.details,
  }, `${emoji} ${operation} ${result}${context.resourceType ? ` [${context.resourceType}:${context.resourceId}]` : ''}`);
}