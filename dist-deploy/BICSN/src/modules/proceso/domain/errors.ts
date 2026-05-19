import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo proceso
 */
export class ProcesoError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un proceso no es encontrado
 */
export class ProcesoNotFoundError extends ProcesoError {
  constructor(identifier: string | number) {
    super(
      `Proceso con identificador '${identifier}' no encontrado`,
      'PROCESO_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un proceso con el mismo nombre
 */
export class ProcesoAlreadyExistsError extends ProcesoError {
  constructor(name: string) {
    super(
      `Ya existe un proceso con el nombre '${name}'`,
      'PROCESO_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error cuando el ID del proceso no es válido
 */
export class ProcesoInvalidIdError extends ProcesoError {
  constructor(id: any) {
    super(
      `El ID del proceso '${id}' no es válido. Debe ser un número entero positivo.`,
      'PROCESO_INVALID_ID',
      400
    );
  }
}

/**
 * Error cuando el nombre del proceso no es válido
 */
export class ProcesoInvalidNombreError extends ProcesoError {
  constructor(nombre: string) {
    super(
      `El nombre del proceso '${nombre}' no es válido. Debe tener entre 2-100 caracteres.`,
      'PROCESO_INVALID_NOMBRE',
      400
    );
  }
}

/**
 * Error cuando el componente del proceso no es válido
 */
export class ProcesoInvalidComponenteError extends ProcesoError {
  constructor(componente: string) {
    super(
      `El componente del proceso '${componente}' no es válido. Debe tener máximo 100 caracteres.`,
      'PROCESO_INVALID_COMPONENTE',
      400
    );
  }
}

/**
 * Error cuando el ID del módulo no es válido
 */
export class ProcesoInvalidIdModuloError extends ProcesoError {
  constructor(idModulo: any) {
    super(
      `El ID del módulo '${idModulo}' no es válido. Debe ser un número entero positivo.`,
      'PROCESO_INVALID_ID_MODULO',
      400
    );
  }
}

/**
 * Error cuando el orden del proceso no es válido
 */
export class ProcesoInvalidOrdenError extends ProcesoError {
  constructor(orden: any) {
    super(
      `El orden del proceso '${orden}' no es válido. Debe ser un número entero positivo.`,
      'PROCESO_INVALID_ORDEN',
      400
    );
  }
}

/**
 * Error cuando el tipo del proceso no es válido
 */
export class ProcesoInvalidTipoError extends ProcesoError {
  constructor(tipo: string) {
    super(
      `El tipo del proceso '${tipo}' no es válido. Debe ser uno de los valores permitidos.`,
      'PROCESO_INVALID_TIPO',
      400
    );
  }
}

/**
 * Error cuando el proceso está en uso y no puede ser eliminado
 */
export class ProcesoInUseError extends ProcesoError {
  constructor(id: number) {
    super(
      `El proceso con ID ${id} está en uso y no puede ser eliminado`,
      'PROCESO_IN_USE',
      409
    );
  }
}

/**
 * Error de permisos para gestionar procesos
 */
export class ProcesoPermissionError extends ProcesoError {
  constructor(userId: string, action: string) {
    super(
      `El usuario '${userId}' no tiene permisos para ${action} procesos.`,
      'PROCESO_PERMISSION_DENIED',
      403
    );
  }
}