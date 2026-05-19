/**
 * Custom Error Classes for Domain-Specific Errors
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 4xx Client Errors
export class ValidationError extends DomainError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string | number) {
    const message = id 
      ? `${resource} with id ${id} not found` 
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ConflictError extends DomainError {
  constructor(resource: string, reason?: string) {
    const message = reason 
      ? `${resource}: ${reason}` 
      : `${resource} already exists`;
    super(message, 'CONFLICT', 409);
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string, details?: any) {
    super(message, 'BAD_REQUEST', 400, details);
  }
}

// 5xx Server Errors
export class DatabaseError extends DomainError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

export class ExternalServiceError extends DomainError {
  constructor(service: string, message: string, details?: any) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 503, details);
  }
}

export class InternalError extends DomainError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 'INTERNAL_ERROR', 500, details);
  }
}

// Business Logic Errors
export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string, details?: any) {
    super(`Business rule violation: ${rule}`, 'BUSINESS_RULE_VIOLATION', 422, details);
  }
}

/**
 * Error Response Builder
 */
export function toErrorResponse(error: Error | DomainError) {
  if (error instanceof DomainError) {
    return {
      ok: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error.details && { details: error.details })
      }
    };
  }

  // Unknown error - don't leak internal details
  return {
    ok: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }
  };
}

/**
 * Check if error is a known domain error
 */
export function isDomainError(error: any): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: Error | DomainError): number {
  if (error instanceof DomainError) {
    return error.statusCode;
  }
  return 500;
}
