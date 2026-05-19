import {
  NotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  DatabaseError
} from '../../../utils/errors.js';

/**
 * Errores específicos del dominio de CategoriaPuestoOrg
 */

// Errores de validación de datos
export class CategoriaPuestoOrgNotFoundError extends NotFoundError {
  constructor(categoriaPuestoOrgId: number, details?: any) {
    super('Categoría de puesto orgánico', categoriaPuestoOrgId);
    (this as any).details = details;
  }
}

export class InvalidCategoriaPuestoOrgDataError extends ValidationError {
  constructor(field: string, reason: string, details?: any) {
    super(`Campo ${field} inválido: ${reason}`, { field, reason, ...details });
  }
}

export class InvalidOrgHierarchyError extends ValidationError {
  constructor(message: string = 'Jerarquía orgánica inválida', details?: any) {
    super(message, details);
  }
}

export class InvalidNivelError extends ValidationError {
  constructor(nivel: number, details?: any) {
    super(`Nivel ${nivel} inválido. Debe estar entre 0 y 3`, { nivel, ...details });
  }
}

export class InvalidIngresoBrutoError extends ValidationError {
  constructor(ingreso: number, details?: any) {
    super(`Ingreso bruto ${ingreso} inválido. Debe ser mayor a 0`, { ingreso, ...details });
  }
}

export class InvalidVigenciaDatesError extends ValidationError {
  constructor(vigenciaInicio: string, vigenciaFin?: string, details?: any) {
    super(`Fechas de vigencia inválidas: ${vigenciaInicio} - ${vigenciaFin || 'indefinida'}`, {
      vigenciaInicio,
      vigenciaFin,
      ...details
    });
  }
}

export class DuplicateCategoriaPuestoOrgError extends BusinessRuleViolationError {
  constructor(categoria: string, org0: string, org1: string, details?: any) {
    super(`Ya existe una categoría ${categoria} para la organización ${org0}-${org1}`, {
      categoria,
      org0,
      org1,
      ...details
    });
  }
}

export class CategoriaPuestoOrgInUseError extends BusinessRuleViolationError {
  constructor(categoriaPuestoOrgId: number, details?: any) {
    super(`No se puede eliminar la categoría de puesto orgánico ${categoriaPuestoOrgId} porque está siendo utilizada`, {
      categoriaPuestoOrgId,
      ...details
    });
  }
}

// Errores de operaciones
export class CategoriaPuestoOrgRegistrationError extends DatabaseError {
  constructor(message: string = 'Error al registrar categoría de puesto orgánico', details?: any) {
    super(message, details);
  }
}

export class CategoriaPuestoOrgUpdateError extends DatabaseError {
  constructor(categoriaPuestoOrgId: number, details?: any) {
    super(`Error al actualizar categoría de puesto orgánico ${categoriaPuestoOrgId}`, {
      categoriaPuestoOrgId,
      ...details
    });
  }
}

export class CategoriaPuestoOrgDeletionError extends DatabaseError {
  constructor(categoriaPuestoOrgId: number, details?: any) {
    super(`Error al eliminar categoría de puesto orgánico ${categoriaPuestoOrgId}`, {
      categoriaPuestoOrgId,
      ...details
    });
  }
}

export class CategoriaPuestoOrgQueryError extends DatabaseError {
  constructor(operation: string, details?: any) {
    super(`Error en consulta de categorías de puesto orgánico: ${operation}`, {
      operation,
      ...details
    });
  }
}