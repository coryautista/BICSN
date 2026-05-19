import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo movimiento
 */
export class MovimientoError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un movimiento no es encontrado
 */
export class MovimientoNotFoundError extends MovimientoError {
  constructor(movimientoId: number) {
    super(
      `Movimiento con ID ${movimientoId} no encontrado`,
      'MOVIMIENTO_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un movimiento con el mismo folio
 */
export class MovimientoAlreadyExistsError extends MovimientoError {
  constructor(folio: string) {
    super(
      `Ya existe un movimiento con el folio: ${folio}`,
      'MOVIMIENTO_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error de validación del tipo de movimiento
 */
export class MovimientoInvalidTipoMovimientoError extends MovimientoError {
  constructor(details: string) {
    super(
      `Tipo de movimiento inválido: ${details}`,
      'MOVIMIENTO_INVALID_TIPO_MOVIMIENTO',
      400
    );
  }
}

/**
 * Error de validación del afiliado
 */
export class MovimientoInvalidAfiliadoError extends MovimientoError {
  constructor(details: string) {
    super(
      `Afiliado inválido: ${details}`,
      'MOVIMIENTO_INVALID_AFILIADO',
      400
    );
  }
}

/**
 * Error de validación de la fecha
 */
export class MovimientoInvalidFechaError extends MovimientoError {
  constructor(details: string) {
    super(
      `Fecha del movimiento inválida: ${details}`,
      'MOVIMIENTO_INVALID_FECHA',
      400
    );
  }
}

/**
 * Error de validación del folio
 */
export class MovimientoInvalidFolioError extends MovimientoError {
  constructor(details: string) {
    super(
      `Folio del movimiento inválido: ${details}`,
      'MOVIMIENTO_INVALID_FOLIO',
      400
    );
  }
}

/**
 * Error de validación del estatus
 */
export class MovimientoInvalidEstatusError extends MovimientoError {
  constructor(details: string) {
    super(
      `Estatus del movimiento inválido: ${details}`,
      'MOVIMIENTO_INVALID_ESTATUS',
      400
    );
  }
}

/**
 * Error de validación del usuario creador
 */
export class MovimientoInvalidCreadorError extends MovimientoError {
  constructor(details: string) {
    super(
      `Usuario creador inválido: ${details}`,
      'MOVIMIENTO_INVALID_CREADOR',
      400
    );
  }
}

/**
 * Error cuando se intenta eliminar un movimiento que ya está procesado
 */
export class MovimientoCannotDeleteError extends MovimientoError {
  constructor(movimientoId: number, estatus: string) {
    super(
      `No se puede eliminar el movimiento ${movimientoId} porque tiene estatus: ${estatus}`,
      'MOVIMIENTO_CANNOT_DELETE',
      409
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de movimiento
 */
export class MovimientoPermissionError extends MovimientoError {
  constructor(operation: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'MOVIMIENTO_PERMISSION_DENIED',
      403
    );
  }
}