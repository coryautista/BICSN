import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo organica3
 */
export class Organica3Error extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando una entidad organica3 no es encontrada
 */
export class Organica3NotFoundError extends Organica3Error {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string) {
    super(
      `Entidad organica3 con clave ${claveOrganica0}-${claveOrganica1}-${claveOrganica2}-${claveOrganica3} no encontrada`,
      'ORGANICA3_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe una entidad organica3 con la misma clave
 */
export class Organica3AlreadyExistsError extends Organica3Error {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string) {
    super(
      `Ya existe una entidad organica3 con la clave: ${claveOrganica0}-${claveOrganica1}-${claveOrganica2}-${claveOrganica3}`,
      'ORGANICA3_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error de validación de la clave organica0
 */
export class Organica3InvalidClaveOrganica0Error extends Organica3Error {
  constructor(details: string) {
    super(
      `Clave organica0 inválida: ${details}`,
      'ORGANICA3_INVALID_CLAVE_ORGANICA0',
      400
    );
  }
}

/**
 * Error de validación de la clave organica1
 */
export class Organica3InvalidClaveOrganica1Error extends Organica3Error {
  constructor(details: string) {
    super(
      `Clave organica1 inválida: ${details}`,
      'ORGANICA3_INVALID_CLAVE_ORGANICA1',
      400
    );
  }
}

/**
 * Error de validación de la clave organica2
 */
export class Organica3InvalidClaveOrganica2Error extends Organica3Error {
  constructor(details: string) {
    super(
      `Clave organica2 inválida: ${details}`,
      'ORGANICA3_INVALID_CLAVE_ORGANICA2',
      400
    );
  }
}

/**
 * Error de validación de la clave organica3
 */
export class Organica3InvalidClaveOrganica3Error extends Organica3Error {
  constructor(details: string) {
    super(
      `Clave organica3 inválida: ${details}`,
      'ORGANICA3_INVALID_CLAVE_ORGANICA3',
      400
    );
  }
}

/**
 * Error de validación de la descripción organica3
 */
export class Organica3InvalidDescripcionError extends Organica3Error {
  constructor(details: string) {
    super(
      `Descripción organica3 inválida: ${details}`,
      'ORGANICA3_INVALID_DESCRIPCION',
      400
    );
  }
}

/**
 * Error de validación del titular organica3
 */
export class Organica3InvalidTitularError extends Organica3Error {
  constructor(details: string) {
    super(
      `Titular organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_TITULAR',
      400
    );
  }
}

/**
 * Error de validación de la calle y número organica3
 */
export class Organica3InvalidCalleNumError extends Organica3Error {
  constructor(details: string) {
    super(
      `Calle y número organica3 inválidos: ${details}`,
      'ORGANICA3_INVALID_CALLE_NUM',
      400
    );
  }
}

/**
 * Error de validación del fraccionamiento organica3
 */
export class Organica3InvalidFraccionamientoError extends Organica3Error {
  constructor(details: string) {
    super(
      `Fraccionamiento organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_FRACCIONAMIENTO',
      400
    );
  }
}

/**
 * Error de validación del código postal organica3
 */
export class Organica3InvalidCodigoPostalError extends Organica3Error {
  constructor(details: string) {
    super(
      `Código postal organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_CODIGO_POSTAL',
      400
    );
  }
}

/**
 * Error de validación del teléfono organica3
 */
export class Organica3InvalidTelefonoError extends Organica3Error {
  constructor(details: string) {
    super(
      `Teléfono organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_TELEFONO',
      400
    );
  }
}

/**
 * Error de validación del fax organica3
 */
export class Organica3InvalidFaxError extends Organica3Error {
  constructor(details: string) {
    super(
      `Fax organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_FAX',
      400
    );
  }
}

/**
 * Error de validación de la localidad organica3
 */
export class Organica3InvalidLocalidadError extends Organica3Error {
  constructor(details: string) {
    super(
      `Localidad organica3 inválida: ${details}`,
      'ORGANICA3_INVALID_LOCALIDAD',
      400
    );
  }
}

/**
 * Error de validación del municipio organica3
 */
export class Organica3InvalidMunicipioError extends Organica3Error {
  constructor(details: string) {
    super(
      `Municipio organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_MUNICIPIO',
      400
    );
  }
}

/**
 * Error de validación del estado organica3
 */
export class Organica3InvalidEstadoError extends Organica3Error {
  constructor(details: string) {
    super(
      `Estado organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_ESTADO',
      400
    );
  }
}

/**
 * Error de validación del estatus organica3
 */
export class Organica3InvalidEstatusError extends Organica3Error {
  constructor(details: string) {
    super(
      `Estatus organica3 inválido: ${details}`,
      'ORGANICA3_INVALID_ESTATUS',
      400
    );
  }
}

/**
 * Error de validación de fechas organica3
 */
export class Organica3InvalidFechaError extends Organica3Error {
  constructor(details: string) {
    super(
      `Fecha organica3 inválida: ${details}`,
      'ORGANICA3_INVALID_FECHA',
      400
    );
  }
}

/**
 * Error cuando se intenta eliminar una entidad organica3 que está en uso
 */
export class Organica3InUseError extends Organica3Error {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string) {
    super(
      `No se puede eliminar la entidad organica3 ${claveOrganica0}-${claveOrganica1}-${claveOrganica2}-${claveOrganica3} porque está siendo utilizada`,
      'ORGANICA3_IN_USE',
      409
    );
  }
}

/**
 * Error cuando la clave organica2 padre no existe
 */
export class Organica3ParentNotFoundError extends Organica3Error {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
    super(
      `La clave organica2 padre ${claveOrganica0}-${claveOrganica1}-${claveOrganica2} no existe`,
      'ORGANICA3_PARENT_NOT_FOUND',
      400
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de organica3
 */
export class Organica3PermissionError extends Organica3Error {
  constructor(operation: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'ORGANICA3_PERMISSION_DENIED',
      403
    );
  }
}

/**
 * Error cuando falla la eliminación de una entidad organica3
 */
export class Organica3DeletionError extends Organica3Error {
  constructor(details: string) {
    super(
      `Error en la eliminación de organica3: ${details}`,
      'ORGANICA3_DELETION_ERROR',
      500
    );
  }
}