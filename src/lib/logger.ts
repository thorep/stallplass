import pino from 'pino';

// Server-side only logger for API endpoints
// Optimized for Vercel's serverless environment

const isProduction = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

// Prevent logger from being used on client-side
if (!isServer) {
  throw new Error('Logger can only be used server-side');
}

// Vercel log level (set via environment variable)
// LOG_LEVEL can be: trace, debug, info, warn, error, fatal
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Create logger optimized for Vercel
export const logger = pino({
  level: logLevel,
  
  // Structured JSON logging for Vercel
  formatters: {
    level: (label: string) => ({ level: label }),
    bindings: () => ({}), // Remove hostname/pid for serverless
  },
  
  // ISO timestamp for better log parsing in Vercel
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Serializers for common objects
  serializers: {
    req: (request: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: unknown;
    }) => ({
      method: request.method,
      url: request.url,
      userAgent: request.headers?.['user-agent'],
      ip: request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip'],
      // Don't log sensitive headers or full body in production
      ...(isProduction ? {} : { 
        headers: {
          host: request.headers?.host,
          referer: request.headers?.referer,
        },
      }),
    }),
    
    res: (response: { 
      statusCode?: number; 
      headers?: Record<string, string>; 
    }) => ({
      statusCode: response.statusCode,
      ...(isProduction ? {} : {
        contentType: response.headers?.['content-type'],
      }),
    }),
    
    err: pino.stdSerializers.err,
    
    // Custom serializer for user context
    user: (user: { id?: string; email?: string; role?: string }) => ({
      id: user.id,
      ...(isProduction ? {} : { email: user.email }),
      role: user.role,
    }),
  },
  
  // Base context for all logs
  base: {
    service: 'stallplass-api',
    environment: process.env.NODE_ENV,
    ...(process.env.VERCEL_ENV && { vercelEnv: process.env.VERCEL_ENV }),
    ...(process.env.VERCEL_REGION && { region: process.env.VERCEL_REGION }),
  },
});

// Helper to create contextual loggers
export const createApiLogger = (context: {
  endpoint?: string;
  method?: string;
  requestId?: string;
  userId?: string;
}) => {
  return logger.child(context);
};

// Pre-configured loggers for common scenarios
export const createErrorLogger = (error: Error, context?: Record<string, unknown>) => {
  return logger.child({ 
    error: error.message,
    stack: error.stack,
    ...context 
  });
};

export const createUserLogger = (userId: string, context?: Record<string, unknown>) => {
  return logger.child({ 
    userId,
    ...context 
  });
};

// Log levels reference for environment variable:
/*
VERCEL ENVIRONMENT VARIABLES:
Set LOG_LEVEL to one of:

- trace (10): Most detailed, includes all logs
- debug (20): Debug information, includes SQL queries, detailed flow
- info (30): General information, API calls, business logic (DEFAULT for production)
- warn (40): Warning conditions, deprecated usage, recoverable errors
- error (50): Error conditions, failed operations, caught exceptions
- fatal (60): Application cannot continue, system failures

RECOMMENDED VERCEL SETTINGS:
- Production: LOG_LEVEL=info (or warn for less verbose)
- Preview: LOG_LEVEL=debug
- Development: LOG_LEVEL=debug (set in local .env.local)

Example usage in API routes:
```typescript
import { logger, createApiLogger } from '@/lib/logger';

// Basic logging
logger.info('Server started');
logger.error({ error }, 'Database connection failed');

// API endpoint logging
const apiLogger = createApiLogger({
  endpoint: '/api/stables',
  method: 'POST',
  requestId: crypto.randomUUID(),
  userId: user.id
});

apiLogger.info({ stableData }, 'Creating new stable');
apiLogger.error({ error, stableId }, 'Failed to create stable');
```
*/