import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo municipios
 */
export class MunicipioError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un municipio no es encontrado
 */
export class MunicipioNotFoundError extends MunicipioError {
  constructor(municipioId: number) {
    super(
      `Municipio con ID ${municipioId} no encontrado`,
      'MUNICIPIO_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un municipio con la misma clave
 */
export class MunicipioAlreadyExistsError extends MunicipioError {
  constructor(claveMunicipio: string) {
    super(
      `Ya existe un municipio con la clave: ${claveMunicipio}`,
      'MUNICIPIO_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error de validación del estado
 */
export class MunicipioInvalidEstadoError extends MunicipioError {
  constructor(details: string) {
    super(
      `Estado inválido: ${details}`,
      'MUNICIPIO_INVALID_ESTADO',
      400
    );
  }
}

/**
 * Error de validación de la clave del municipio
 */
export class MunicipioInvalidClaveError extends MunicipioError {
  constructor(details: string) {
    super(
      `Clave del municipio inválida: ${details}`,
      'MUNICIPIO_INVALID_CLAVE',
      400
    );
  }
}

/**
 * Error de validación del nombre del municipio
 */
export class MunicipioInvalidNombreError extends MunicipioError {
  constructor(details: string) {
    super(
      `Nombre del municipio inválido: ${details}`,
      'MUNICIPIO_INVALID_NOMBRE',
      400
    );
  }
}

/**
 * Error de validación del ID del municipio
 */
export class MunicipioInvalidIdError extends MunicipioError {
  constructor(details: string) {
    super(
      `ID del municipio inválido: ${details}`,
      'MUNICIPIO_INVALID_ID',
      400
    );
  }
}

/**
 * Error cuando se intenta eliminar un municipio que está en uso
 */
export class MunicipioInUseError extends MunicipioError {
  constructor(municipioId: number) {
    super(
      `No se puede eliminar el municipio ${municipioId} porque está siendo utilizado`,
      'MUNICIPIO_IN_USE',
      409
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de municipio
 */
export class MunicipioPermissionError extends MunicipioError {
  constructor(operation: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'MUNICIPIO_PERMISSION_DENIED',
      403
    );
  }
}