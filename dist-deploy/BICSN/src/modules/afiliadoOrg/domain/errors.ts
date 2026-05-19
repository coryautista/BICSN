import {
  NotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  DatabaseError
} from '../../../utils/errors.js';

/**
 * Errores específicos del dominio de AfiliadoOrg
 */

export class AfiliadoOrgNotFoundError extends NotFoundError {
  constructor(filters: Record<string, any>) {
    super('AfiliadoOrg', JSON.stringify(filters));
  }
}

export class AfiliadoOrgAlreadyExistsError extends BusinessRuleViolationError {
  constructor(details: Record<string, any>) {
    super('La relación afiliado-organización ya está registrada', details);
  }
}

export class InvalidAfiliadoOrgDataError extends ValidationError {
  constructor(field: string, reason: string) {
    super(`Datos de afiliado-org inválidos: ${field} - ${reason}`, { field, reason });
  }
}

export class InvalidOrgHierarchyError extends ValidationError {
  constructor(message: string, details?: any) {
    super(`Jerarquía organizacional inválida: ${message}`, details);
  }
}

export class InvalidOrgLevelError extends ValidationError {
  constructor(level: number) {
    super(`El nivel organizacional debe estar entre 0 y 3, se recibió ${level}`, { level });
  }
}

export class InvalidSueldoError extends ValidationError {
  constructor(sueldo: number) {
    super(`El sueldo debe ser un valor positivo, se recibió ${sueldo}`, { sueldo });
  }
}

export class InvalidFechaMovAltError extends ValidationError {
  constructor(fecha: string) {
    super(`La fecha de movimiento/alta '${fecha}' no es válida`, { fecha });
  }
}

export class AfiliadoNotFoundForOrgError extends ValidationError {
  constructor(afiliadoId: number) {
    super(`El afiliado con ID ${afiliadoId} no existe`, { afiliadoId });
  }
}

export class AfiliadoOrgPermissionError extends BusinessRuleViolationError {
  constructor(operation: string, reason: string) {
    super(`No tiene permisos para realizar la operación '${operation}' en afiliado-org: ${reason}`, { operation, reason });
  }
}

export class AfiliadoOrgRegistrationError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al registrar relación afiliado-organización: ${message}`, details);
  }
}

export class AfiliadoOrgUpdateError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al actualizar relación afiliado-organización: ${message}`, details);
  }
}

export class AfiliadoOrgDeletionError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al eliminar relación afiliado-organización: ${message}`, details);
  }
}

export class AfiliadoOrgQueryError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al consultar relación afiliado-organización: ${message}`, details);
  }
}

export class DuplicateAfiliadoOrgError extends BusinessRuleViolationError {
  constructor(afiliadoId: number, claveOrganica: string) {
    super(`Ya existe una relación para el afiliado ${afiliadoId} con la clave orgánica ${claveOrganica}`, { afiliadoId, claveOrganica });
  }
}

export class InvalidOrgClaveError extends ValidationError {
  constructor(clave: string, level: number) {
    super(`La clave orgánica '${clave}' para el nivel ${level} no es válida`, { clave, level });
  }
}

export class AfiliadoOrgValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(`Error de validación de afiliado-org: ${message}`, details);
  }
}