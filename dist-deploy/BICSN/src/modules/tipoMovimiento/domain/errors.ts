import { DomainError } from '../../../utils/errors.js';

export class TipoMovimientoNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Tipo de movimiento no encontrado: ${identifier}`, 'TIPO_MOVIMIENTO_NOT_FOUND', 404);
  }
}

export class TipoMovimientoAlreadyExistsError extends DomainError {
  constructor(identifier: string) {
    super(`Ya existe un tipo de movimiento con ID: ${identifier}`, 'TIPO_MOVIMIENTO_ALREADY_EXISTS', 409);
  }
}

export class TipoMovimientoInvalidIdError extends DomainError {
  constructor(id: string) {
    super(`ID de tipo de movimiento inválido: ${id}`, 'TIPO_MOVIMIENTO_INVALID_ID', 400);
  }
}

export class TipoMovimientoInvalidAbreviaturaError extends DomainError {
  constructor(abreviatura: string) {
    super(`Abreviatura inválida: ${abreviatura}. Debe tener entre 1-10 caracteres`, 'TIPO_MOVIMIENTO_INVALID_ABREVIATURA', 400);
  }
}

export class TipoMovimientoInvalidNombreError extends DomainError {
  constructor(nombre: string) {
    super(`Nombre inválido: ${nombre}. Debe tener entre 1-100 caracteres`, 'TIPO_MOVIMIENTO_INVALID_NOMBRE', 400);
  }
}

export class TipoMovimientoInUseError extends DomainError {
  constructor(identifier: string) {
    super(`Tipo de movimiento está en uso y no puede ser eliminado: ${identifier}`, 'TIPO_MOVIMIENTO_IN_USE', 409);
  }
}

export class TipoMovimientoPermissionError extends DomainError {
  constructor(action: string) {
    super(`No tienes permisos para ${action} este tipo de movimiento`, 'TIPO_MOVIMIENTO_PERMISSION_ERROR', 403);
  }
}

export class TipoMovimientoError extends DomainError {
  constructor(message: string, code: string = 'TIPO_MOVIMIENTO_ERROR', statusCode: number = 500) {
    super(message, code, statusCode);
  }
}