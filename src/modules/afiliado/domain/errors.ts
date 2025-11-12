import {
  NotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  DatabaseError
} from '../../../utils/errors.js';

/**
 * Errores específicos del dominio de Afiliado
 */

export class AfiliadoNotFoundError extends NotFoundError {
  constructor(filters: Record<string, any>) {
    super('Afiliado', JSON.stringify(filters));
  }
}

export class AfiliadoAlreadyExistsError extends BusinessRuleViolationError {
  constructor(details: Record<string, any>) {
    super('El afiliado ya está registrado con estos datos', details);
  }
}

export class InvalidAfiliadoDataError extends ValidationError {
  constructor(field: string, reason: string) {
    super(`Datos de afiliado inválidos: ${field} - ${reason}`, { field, reason });
  }
}

export class InvalidCurpError extends ValidationError {
  constructor(curp: string) {
    super(`La CURP '${curp}' no tiene un formato válido`, { curp });
  }
}

export class InvalidRfcError extends ValidationError {
  constructor(rfc: string) {
    super(`El RFC '${rfc}' no tiene un formato válido`, { rfc });
  }
}

export class InvalidNumeroSeguroSocialError extends ValidationError {
  constructor(nss: string) {
    super(`El número de seguro social '${nss}' no tiene un formato válido`, { nss });
  }
}

export class InvalidFechaNacimientoError extends ValidationError {
  constructor(fecha: string) {
    super(`La fecha de nacimiento '${fecha}' no es válida`, { fecha });
  }
}

export class InvalidInternoError extends ValidationError {
  constructor(interno: number) {
    super(`El número interno '${interno}' no es válido o no existe en el sistema`, { interno });
  }
}

export class InternoNotFoundInFirebirdError extends ValidationError {
  constructor(interno: number) {
    super(`El interno '${interno}' no existe en las tablas PERSONAL u ORG_PERSONAL de Firebird`, { interno });
  }
}

export class AfiliadoPermissionError extends BusinessRuleViolationError {
  constructor(operation: string, reason: string) {
    super(`No tiene permisos para realizar la operación '${operation}': ${reason}`, { operation, reason });
  }
}

export class AfiliadoRegistrationError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al registrar afiliado: ${message}`, details);
  }
}

export class AfiliadoUpdateError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al actualizar afiliado: ${message}`, details);
  }
}

export class AfiliadoDeletionError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al eliminar afiliado: ${message}`, details);
  }
}

export class AfiliadoQueryError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al consultar afiliado: ${message}`, details);
  }
}

export class CambioSueldoError extends BusinessRuleViolationError {
  constructor(reason: string, details?: any) {
    super(`Error en cambio de sueldo: ${reason}`, details);
  }
}

export class BajaPermanenteError extends BusinessRuleViolationError {
  constructor(reason: string, details?: any) {
    super(`Error en baja permanente: ${reason}`, details);
  }
}

export class BajaSuspensionError extends BusinessRuleViolationError {
  constructor(reason: string, details?: any) {
    super(`Error en suspensión: ${reason}`, details);
  }
}

export class TerminarSuspensionError extends BusinessRuleViolationError {
  constructor(reason: string, details?: any) {
    super(`Error al terminar suspensión: ${reason}`, details);
  }
}

export class MovimientosQuincenalesQueryError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al obtener movimientos quincenales: ${message}`, details);
  }
}

export class AfiliadoValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(`Error de validación de afiliado: ${message}`, details);
  }
}