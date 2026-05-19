import { FastifyRequest, FastifyReply } from 'fastify';
import { DomainError, toErrorResponse, getStatusCode, isDomainError } from './errors.js';

/**
 * Structured logging context
 */
export interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Error Logger with structured context
 */
export class ErrorLogger {
  constructor(
    private logger: any, // Pino logger
    private context: LogContext = {}
  ) {}

  /**
   * Log error with full context
   */
  logError(error: Error, additionalContext?: LogContext) {
    const fullContext = { ...this.context, ...additionalContext };
    
    if (isDomainError(error)) {
      // Domain errors - log as warning (expected business errors)
      this.logger.warn({
        ...fullContext,
        errorCode: error.code,
        errorMessage: error.message,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details })
      }, `Domain error: ${error.code}`);
    } else {
      // Unknown errors - log as error with stack trace
      this.logger.error({
        ...fullContext,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      }, `Unexpected error: ${error.message}`);
    }
  }

  /**
   * Log info with context
   */
  logInfo(message: string, data?: any) {
    this.logger.info({ ...this.context, ...data }, message);
  }

  /**
   * Log debug with context
   */
  logDebug(message: string, data?: any) {
    this.logger.debug({ ...this.context, ...data }, message);
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): ErrorLogger {
    return new ErrorLogger(this.logger, { ...this.context, ...additionalContext });
  }
}

/**
 * Error Handler Middleware for specific modules
 */
export function createErrorHandler(module: string) {
  return async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const logger = new ErrorLogger(request.log, {
      module,
      requestId: request.id,
      method: request.method,
      url: request.url,
      userId: (request as any).user?.sub
    });

    logger.logError(error);

    const statusCode = getStatusCode(error);
    const response = toErrorResponse(error);

    return reply.code(statusCode).send(response);
  };
}

/**
 * Error Boundary for route handlers
 */
export function errorBoundary(
  handler: (req: FastifyRequest, reply: FastifyReply) => Promise<any>,
  context: LogContext
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const logger = new ErrorLogger(req.log, {
      ...context,
      requestId: req.id,
      method: req.method,
      url: req.url,
      userId: (req as any).user?.sub
    });

    try {
      logger.logDebug('Request started');
      const result = await handler(req, reply);
      logger.logDebug('Request completed successfully');
      return result;
    } catch (error: any) {
      logger.logError(error);

      const statusCode = getStatusCode(error);
      const response = toErrorResponse(error);

      return reply.code(statusCode).send(response);
    }
  };
}

/**
 * Try-catch wrapper with automatic error handling
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  logger: ErrorLogger,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    logger.logError(error);
    
    if (isDomainError(error)) {
      throw error;
    }
    
    throw new DomainError(
      errorMessage || 'Operation failed',
      'OPERATION_FAILED',
      500,
      { originalError: error.message }
    );
  }
}
