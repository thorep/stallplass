import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export function withApiLogging(
  handler: ApiHandler,
  options?: { skipLogging?: boolean }
): ApiHandler {
  return async (req: NextRequest) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    const reqLogger = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      pathname: new URL(req.url).pathname,
    });

    if (!options?.skipLogging) {
      reqLogger.info('API request started');
    }

    try {
      const response = await handler(req);
      const duration = Date.now() - start;

      if (!options?.skipLogging) {
        reqLogger.info({
          status: response.status,
          duration,
        }, 'API request completed');
      }

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      reqLogger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      }, 'API request failed');

      // Re-throw to let Next.js handle the error response
      throw error;
    }
  };
}