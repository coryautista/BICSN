import {
  DomainError,
  NotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  DatabaseError
} from '../../../utils/errors.js';

/**
 * Errores específicos del dominio de Afectación Organizacional
 */

export class AfectacionNotFoundError extends NotFoundError {
  constructor(filters: Record<string, any>) {
    super('Afectación', JSON.stringify(filters));
  }
}

export class InvalidAfectacionDataError extends ValidationError {
  constructor(field: string, reason: string) {
    super(`Datos de afectación inválidos: ${field} - ${reason}`, { field, reason });
  }
}

export class InvalidQuincenaError extends ValidationError {
  constructor(quincena: number) {
    super(`La quincena debe estar entre 1 y 24, se recibió ${quincena}`, { quincena });
  }
}

export class InvalidAnioError extends ValidationError {
  constructor(anio: number) {
    super(`El año debe estar entre 2000 y 2100, se recibió ${anio}`, { anio });
  }
}

export class InvalidOrgNivelError extends ValidationError {
  constructor(orgNivel: number) {
    super(`El nivel organizacional debe estar entre 0 y 3, se recibió ${orgNivel}`, { orgNivel });
  }
}

export class AfectacionAlreadyExistsError extends BusinessRuleViolationError {
  constructor(details: Record<string, any>) {
    super('La afectación ya está registrada para esta unidad organizacional y período', details);
  }
}

export class AfectacionRegistrationError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(`Error al registrar afectación: ${message}`, details);
  }
}

export class AfectacionQueryError extends DatabaseError {
  constructor(operation: string, details?: any) {
    super(`Error al consultar afectaciones: ${operation}`, details);
  }
}

export class InvalidDateForQuincenaError extends ValidationError {
  constructor(date: string) {
    super(`Formato de fecha inválido para cálculo de quincena: ${date}`, { date });
  }
}

export class OrgHierarchyValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(`Validación de jerarquía organizacional fallida: ${message}`, details);
  }
}

export class AfectacionPermissionError extends DomainError {
  constructor(usuario: string, operation: string) {
    super(
      `El usuario ${usuario} no tiene permisos para ${operation}`,
      'AFECTACION_PERMISSION_ERROR',
      403,
      { usuario, operation }
    );
  }
}
