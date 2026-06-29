import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure pino logger
const pinoConfig = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Add pretty printing in development
const transport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

export const logger = pino(pinoConfig, transport ? pino.transport(transport) : undefined);

/**
 * Log payment event
 */
export function logPayment(data) {
  logger.info(
    {
      type: 'payment',
      ...data,
    },
    'Payment event'
  );
}

/**
 * Log order event
 */
export function logOrder(data) {
  logger.info(
    {
      type: 'order',
      ...data,
    },
    'Order event'
  );
}

/**
 * Log delivery event
 */
export function logDelivery(data) {
  logger.info(
    {
      type: 'delivery',
      ...data,
    },
    'Delivery event'
  );
}

/**
 * Log dispute event
 */
export function logDispute(data) {
  logger.info(
    {
      type: 'dispute',
      ...data,
    },
    'Dispute event'
  );
}

/**
 * Log error with context
 */
export function logError(error, context = {}) {
  logger.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      ...context,
    },
    'Error occurred'
  );
}

export default logger;
