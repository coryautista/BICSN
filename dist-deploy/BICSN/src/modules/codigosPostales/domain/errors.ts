import {
  NotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  DatabaseError
} from '../../../utils/errors.js';

/**
 * Errores específicos del dominio de CodigosPostales
 */

// Errores de validación de datos
export class CodigoPostalNotFoundError extends NotFoundError {
  constructor(codigoPostalId: number, details?: any) {
    super('Código postal', codigoPostalId);
    (this as any).details = details;
  }
}

export class CodigoPostalByCodeNotFoundError extends NotFoundError {
  constructor(codigoPostal: string, details?: any) {
    super(`Código postal ${codigoPostal}`, undefined);
    (this as any).details = { codigoPostal, ...details };
  }
}

export class InvalidCodigoPostalDataError extends ValidationError {
  constructor(field: string, reason: string, details?: any) {
    super(`Campo ${field} inválido: ${reason}`, { field, reason, ...details });
  }
}

export class InvalidCodigoPostalFormatError extends ValidationError {
  constructor(codigoPostal: string, details?: any) {
    super(`Formato de código postal inválido: ${codigoPostal}. Debe ser exactamente 5 dígitos`, {
      codigoPostal,
      ...details
    });
  }
}

export class DuplicateCodigoPostalError extends BusinessRuleViolationError {
  constructor(codigoPostal: string, details?: any) {
    super(`Ya existe un código postal ${codigoPostal}`, {
      codigoPostal,
      ...details
    });
  }
}

export class CodigoPostalInUseError extends BusinessRuleViolationError {
  constructor(codigoPostalId: number, details?: any) {
    super(`No se puede eliminar el código postal ${codigoPostalId} porque está siendo utilizado`, {
      codigoPostalId,
      ...details
    });
  }
}

// Errores de operaciones
export class CodigoPostalRegistrationError extends DatabaseError {
  constructor(message: string = 'Error al registrar código postal', details?: any) {
    super(message, details);
  }
}

export class CodigoPostalUpdateError extends DatabaseError {
  constructor(codigoPostalId: number, details?: any) {
    super(`Error al actualizar código postal ${codigoPostalId}`, {
      codigoPostalId,
      ...details
    });
  }
}

export class CodigoPostalDeletionError extends DatabaseError {
  constructor(codigoPostalId: number, details?: any) {
    super(`Error al eliminar código postal ${codigoPostalId}`, {
      codigoPostalId,
      ...details
    });
  }
}

export class CodigoPostalQueryError extends DatabaseError {
  constructor(operation: string, details?: any) {
    super(`Error en consulta de códigos postales: ${operation}`, {
      operation,
      ...details
    });
  }
}