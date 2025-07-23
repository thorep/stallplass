import pino from 'pino';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';
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

  // Rotating file output stream
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