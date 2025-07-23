import pino from 'pino';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';

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
          send: function (level, logEvent) {
            // In production, could send browser errors to monitoring service
            if (isProduction && level.value >= 50) { // error and above
              // Example: send to error tracking service
              // sendToErrorTracking(logEvent);
            }
          }
        }
      },
      level: isProduction ? 'error' : 'debug',
    });
  }

  // Server logger configuration
  const streams = [];
  
  // Console output stream (with pretty printing in development)
  streams.push({
    stream: isProduction
      ? process.stdout
      : pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          }
        })
  });

  // File output stream
  const logFile = path.join(process.cwd(), 'logs', 'app.log');
  streams.push({
    stream: pino.destination({
      dest: logFile,
      sync: false, // Async for better performance
    })
  });

  return pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    formatters: {
      level: (label) => ({ level: label })
    },
    timestamp: () => `,"time":"${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}"`,
    serializers: {
      req: (request) => ({
        method: request.method,
        url: request.url,
        headers: {
          host: request.headers.host,
          'user-agent': request.headers['user-agent'],
        },
      }),
      res: (response) => ({
        statusCode: response.statusCode,
      }),
      err: pino.stdSerializers.err,
    },
  }, pino.multistream(streams));
};

// Create the logger instance
export const logger = createLogger();

// Helper function to create child loggers with context
export const createContextLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

// Log levels for reference:
// logger.trace() - 10
// logger.debug() - 20
// logger.info()  - 30
// logger.warn()  - 40
// logger.error() - 50
// logger.fatal() - 60