import pino from 'pino';
import { format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';
import createRotatingFileStream from 'pino-rotating-file-stream';

const isProduction = process.env.NODE_ENV === 'production';
const isBrowser = typeof window !== 'undefined';

// Ensure logs directory exists
if (!isBrowser) {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Create different loggers for browser and server
const createLogger = () => {
  // Browser logger configuration
  if (isBrowser) {
    return pino({
      browser: {
        asObject: true,
        transmit: {
          level: 'error',
          send: function () {
            // In production, could send browser errors to monitoring service
            // Example: if (isProduction) sendToErrorTracking(logEvent);
          }
        }
      },
      level: isProduction ? 'error' : 'debug',
    });
  }

  // Server logger configuration
  const streams = [];
  
  // Console output stream
  streams.push({
    stream: process.stdout
  });

  // Rotating file output stream (only in production or when explicitly enabled)
  if (isProduction || process.env.ENABLE_FILE_LOGGING === 'true') {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      streams.push({
        stream: createRotatingFileStream({
          path: logsDir,
          filename: 'app.log',
          size: '10M',      // Rotate when file reaches 10MB
          interval: '1d',   // Rotate daily
          compress: 'gzip', // Compress old log files
          maxFiles: 7,      // Keep 7 days of logs
        })
      });
    } catch (error) {
      console.warn('Failed to create rotating file stream:', error);
    }
  }

  const loggerOptions = {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    formatters: {
      level: (label: string) => ({ level: label })
    },
    timestamp: () => `,"time":"${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}"`,
    serializers: {
      req: (request: { method?: string; url?: string; headers?: Record<string, string> }) => ({
        method: request.method,
        url: request.url,
        headers: {
          host: request.headers?.host,
          'user-agent': request.headers?.['user-agent'],
        },
      }),
      res: (response: { statusCode?: number }) => ({
        statusCode: response.statusCode,
      }),
      err: pino.stdSerializers.err,
    },
  };

  // Use multistream only if we have multiple streams, otherwise use single stream
  return streams.length > 1 
    ? pino(loggerOptions, pino.multistream(streams))
    : pino(loggerOptions, streams[0].stream);
};

// Create the logger instance
export const logger = createLogger();

// Helper function to create child loggers with context
export const createContextLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};

// Log levels for reference:
// logger.trace() - 10
// logger.debug() - 20
// logger.info()  - 30
// logger.warn()  - 40
// logger.error() - 50
// logger.fatal() - 60