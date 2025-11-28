import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { DomainError, toErrorResponse, getStatusCode, isDomainError, ValidationError, DatabaseError, ExternalServiceError } from './errors.js';

/**
 * Enhanced error context with correlation tracking
 */
export interface ErrorContext {
  requestId: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  method: string;
  url: string;
  timestamp: string;
  module?: string;
  action?: string;
  errorId?: string;
  [key: string]: any;
}

/**
 * Error boundary configuration options
 */
export interface ErrorBoundaryOptions {
  module?: string;
  action?: string;
  retryable?: boolean;
  maxRetries?: number;
  fallback?: (error: Error, context: ErrorContext) => Promise<any>;
  logLevel?: 'error' | 'warn' | 'info';
  includeStack?: boolean;
  includeRequest?: boolean;
}

/**
 * Error recovery strategy
 */
export interface RecoveryStrategy {
  canRetry(error: Error): boolean;
  retryDelay(error: Error): number;
  maxRetries(error: Error): number;
}

/**
 * Standard recovery strategies
 */
export const RecoveryStrategies = {
  database: {
    canRetry: (error: Error) => {
      if (error instanceof DatabaseError) {
        return error.message.includes('timeout') || 
               error.message.includes('connection') ||
               error.message.includes('deadlock');
      }
      return false;
    },
    retryDelay: (error: Error) => 1000, // 1 second
    maxRetries: (error: Error) => 3
  },
  external: {
    canRetry: (error: Error) => {
      if (error instanceof ExternalServiceError) {
        return error.message.includes('timeout') ||
               error.message.includes('503') ||
               error.message.includes('gateway');
      }
      return false;
    },
    retryDelay: (error: Error) => 2000, // 2 seconds
    maxRetries: (error: Error) => 5
  },
  general: {
    canRetry: () => false,
    retryDelay: () => 0,
    maxRetries: () => 0
  }
} as const;

/**
 * Enhanced Error Boundary with recovery and correlation
 */
export class ErrorBoundary {
  private context: ErrorContext;
  private options: Required<ErrorBoundaryOptions>;
  private retryCount = 0;
  private correlationId: string;

  constructor(
    private request: FastifyRequest,
    private reply: FastifyReply,
    private logger: any,
    options: ErrorBoundaryOptions = {}
  ) {
    this.correlationId = this.extractCorrelationId() || uuidv4();
    this.options = {
      module: options.module || 'unknown',
      action: options.action || 'unknown',
      retryable: options.retryable ?? false,
      maxRetries: options.maxRetries ?? 0,
      fallback: options.fallback || (() => Promise.reject(new Error('No fallback provided'))),
      logLevel: options.logLevel || 'error',
      includeStack: options.includeStack ?? false,
      includeRequest: options.includeRequest ?? false,
      ...options
    };

    this.context = this.buildContext();
  }

  /**
   * Execute operation with comprehensive error handling
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      this.logDebug('Operation started', { operation: this.options.action });
      
      const result = await operation();
      
      this.logInfo('Operation completed successfully');
      return result;

    } catch (error) {
      return this.handleError(error as Error);
    }
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    strategy: RecoveryStrategy = RecoveryStrategies.general
  ): Promise<T> {
    try {
      this.logDebug('Operation with retry started', { 
        operation: this.options.action,
        retryCount: this.retryCount
      });

      const result = await operation();
      
      this.logInfo('Operation completed successfully after retry');
      return result;

    } catch (error) {
      const errorObj = error as Error;
      const shouldRetry = this.options.retryable && 
                         this.retryCount < this.options.maxRetries &&
                         strategy.canRetry(errorObj);

      if (shouldRetry) {
        this.retryCount++;
        this.logWarn('Operation failed, retrying', { 
          error: errorObj.message,
          retryCount: this.retryCount,
          maxRetries: this.options.maxRetries
        });

        // Exponential backoff with jitter
        const delay = strategy.retryDelay(errorObj) * Math.pow(2, this.retryCount - 1);
        await this.sleep(delay + Math.random() * 1000); // Add jitter

        return this.executeWithRetry(operation, strategy);
      }

      return this.handleError(errorObj);
    }
  }

  /**
   * Handle error with enhanced logging and recovery
   */
  private async handleError<T>(error: Error): Promise<T> {
    const errorId = uuidv4();
    const errorContext = { ...this.context, errorId };

    // Enhanced error logging
    this.logErrorWithContext(error, errorContext);

    // Try fallback if available and different from default
    if (this.options.fallback && this.options.fallback !== (() => Promise.reject(new Error('No fallback provided')))) {
      try {
        this.logInfo('Attempting fallback operation');
        const fallbackResult = await this.options.fallback(error, errorContext);
        this.logInfo('Fallback operation succeeded');
        return fallbackResult;
      } catch (fallbackError) {
        this.logError('Fallback operation also failed', fallbackError);
      }
    }

    // Send standardized error response
    const response = this.buildErrorResponse(error, errorContext);
    const statusCode = this.getErrorStatusCode(error);

    this.logInfo('Sending error response', { 
      statusCode, 
      errorCode: response.error?.code,
      errorId 
    });

    return this.reply.code(statusCode).send(response) as any;
  }

  /**
   * Build comprehensive error response
   */
  buildErrorResponse(error: Error, context: ErrorContext) {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDomainError(error)) {
      const response = toErrorResponse(error);
      
      return {
        ...response,
        metadata: {
          requestId: context.requestId,
          correlationId: context.correlationId,
          timestamp: context.timestamp,
          errorId: context.errorId,
          ...(isDev && this.options.includeStack && { stack: error.stack }),
          ...(isDev && this.options.includeRequest && { 
            request: {
              method: context.method,
              url: context.url,
              userAgent: context.userAgent,
              ip: context.ip
            }
          })
        }
      };
    }

    // Unknown error - safe response
    return {
      ok: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      },
      metadata: {
        requestId: context.requestId,
        correlationId: context.correlationId,
        timestamp: context.timestamp,
        errorId: context.errorId,
        ...(isDev && this.options.includeStack && { 
          stack: error.stack,
          originalMessage: error.message 
        })
      }
    };
  }

  /**
   * Get appropriate HTTP status code for error
   */
  getErrorStatusCode(error: Error): number {
    if (isDomainError(error)) {
      return error.statusCode;
    }

    // Classify unknown errors
    if (error.message.includes('timeout')) return 408;
    if (error.message.includes('validation') || error.message.includes('required')) return 400;
    if (error.message.includes('permission') || error.message.includes('authorized')) return 403;
    if (error.message.includes('not found')) return 404;
    
    return 500;
  }

  /**
   * Enhanced logging with context
   */
  private logErrorWithContext(error: Error, context: ErrorContext) {
    const logData = {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      ...(this.options.includeStack && { stack: error.stack }),
      retryCount: this.retryCount,
      retryable: this.options.retryable,
      module: this.options.module,
      action: this.options.action
    };

    if (isDomainError(error)) {
      this.logger.warn(logData, `Domain error: ${error.code}`);
    } else {
      this.logger.error(logData, `Unexpected error: ${error.message}`);
    }
  }

  /**
   * Build error context from request
   */
  private buildContext(): ErrorContext {
    return {
      requestId: this.request.id,
      correlationId: this.correlationId,
      userId: (this.request as any).user?.sub,
      sessionId: this.extractSessionId(),
      ip: this.extractIP(),
      userAgent: this.request.headers['user-agent'],
      method: this.request.method,
      url: this.request.url,
      timestamp: new Date().toISOString(),
      module: this.options.module,
      action: this.options.action
    };
  }

  /**
   * Extract correlation ID from request headers
   */
  private extractCorrelationId(): string | undefined {
    return this.request.headers['x-correlation-id'] as string ||
           this.request.headers['x-request-id'] as string;
  }

  /**
   * Extract session ID from request
   */
  private extractSessionId(): string | undefined {
    // Try various places where session ID might be stored
    return (this.request as any).session?.id ||
           this.request.headers['x-session-id'] as string;
  }

  /**
   * Extract client IP address
   */
  private extractIP(): string {
    return this.request.ip ||
           this.request.headers['x-forwarded-for'] as string ||
           this.request.headers['x-real-ip'] as string ||
           'unknown';
  }

  /**
   * Utility logging methods
   */
  private logDebug(message: string, data?: any) {
    this.logger.debug({ ...this.context, ...data }, message);
  }

  private logInfo(message: string, data?: any) {
    this.logger.info({ ...this.context, ...data }, message);
  }

  private logWarn(message: string, data?: any) {
    this.logger.warn({ ...this.context, ...data }, message);
  }

  private logError(message: string, error?: any) {
    this.logger.error({ ...this.context, error }, message);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the current context
   */
  getContext(): ErrorContext {
    return { ...this.context };
  }
}

/**
 * Factory function to create error boundary
 */
export function createErrorBoundary(
  request: FastifyRequest,
  reply: FastifyReply,
  logger: any,
  options: ErrorBoundaryOptions = {}
): ErrorBoundary {
  return new ErrorBoundary(request, reply, logger, options);
}

/**
 * Decorator for route handlers
 */
export function withErrorBoundary(
  handler: (req: FastifyRequest, reply: FastifyReply) => Promise<any>,
  options: ErrorBoundaryOptions = {}
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const boundary = createErrorBoundary(req, reply, (req as any).log, options);
    return boundary.execute(() => handler(req, reply));
  };
}

/**
 * Retryable decorator
 */
export function withRetry(
  handler: (req: FastifyRequest, reply: FastifyReply) => Promise<any>,
  strategy: RecoveryStrategy = RecoveryStrategies.general,
  options: ErrorBoundaryOptions = {}
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const boundary = createErrorBoundary(req, reply, (req as any).log, {
      retryable: true,
      maxRetries: strategy.maxRetries(new Error('dummy')),
      ...options
    });
    return boundary.executeWithRetry(() => handler(req, reply), strategy);
  };
}

/**
 * Module-specific error boundary factory
 */
export function createModuleErrorBoundary(
  module: string,
  action: string,
  options: Omit<ErrorBoundaryOptions, 'module' | 'action'> = {}
) {
  return (req: FastifyRequest, reply: FastifyReply, logger: any) => {
    return createErrorBoundary(req, reply, logger, {
      module,
      action,
      ...options
    });
  };
}

/**
 * Global error handler for Fastify
 */
export function createGlobalErrorHandler() {
  return async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const boundary = createErrorBoundary(request, reply, (request as any).log, {
      module: 'global',
      action: 'request-handler',
      includeStack: process.env.NODE_ENV === 'development',
      includeRequest: true
    });

    // For global handler, we can't return the result directly
    // This is used as Fastify error handler
    try {
      const context = boundary.getContext();
      const response = boundary.buildErrorResponse(error, context);
      const statusCode = boundary.getErrorStatusCode(error);
      return reply.code(statusCode).send(response);
    } catch (handlerError) {
      // If error boundary itself fails, log and send basic response
      (request as any).log?.error({ 
        error: handlerError, 
        originalError: error 
      }, 'Error boundary failed');
      
      return reply.code(500).send({
        ok: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  };
}

/**
 * Health check for error boundary system
 */
export function createErrorBoundaryHealthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      errorHandling: {
        status: 'healthy',
        message: 'Error boundary system operational',
        responseTime: 0
      }
    }
  };
}