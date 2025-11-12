import { DomainError } from '../../../utils/errors.js';

export class ColoniaError extends DomainError {
  constructor(message: string, operation: string, details?: Record<string, any>) {
    super(message, `COLONIA_${operation.toUpperCase()}_ERROR`, 500, details);
  }
}

export class ColoniaNotFoundError extends ColoniaError {
  constructor(coloniaId: number) {
    super(
      `Colonia con ID ${coloniaId} no encontrada`,
      'findById',
      { coloniaId }
    );
  }
}

export class ColoniaByMunicipioNotFoundError extends ColoniaError {
  constructor(municipioId: number) {
    super(
      `No se encontraron colonias para el municipio ${municipioId}`,
      'findByMunicipio',
      { municipioId }
    );
  }
}

export class ColoniaByCodigoPostalNotFoundError extends ColoniaError {
  constructor(codigoPostalId: number) {
    super(
      `No se encontraron colonias para el código postal ${codigoPostalId}`,
      'findByCodigoPostal',
      { codigoPostalId }
    );
  }
}

export class DuplicateColoniaError extends ColoniaError {
  constructor(nombreColonia: string, municipioId: number) {
    super(
      `Ya existe una colonia con nombre '${nombreColonia}' en el municipio ${municipioId}`,
      'create',
      { nombreColonia, municipioId }
    );
  }
}

export class InvalidColoniaDataError extends ColoniaError {
  constructor(field: string, reason: string) {
    super(
      `Campo '${field}' inválido: ${reason}`,
      'validation',
      { field, reason }
    );
  }
}

export class MunicipioNotFoundError extends ColoniaError {
  constructor(municipioId: number) {
    super(
      `Municipio con ID ${municipioId} no encontrado`,
      'municipioValidation',
      { municipioId }
    );
  }
}

export class CodigoPostalNotFoundError extends ColoniaError {
  constructor(codigoPostalId: number) {
    super(
      `Código postal con ID ${codigoPostalId} no encontrado`,
      'codigoPostalValidation',
      { codigoPostalId }
    );
  }
}

export class ColoniaQueryError extends ColoniaError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en consulta de colonias: ${operation}`,
      'query',
      details
    );
  }
}

export class ColoniaCommandError extends ColoniaError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en comando de colonias: ${operation}`,
      'command',
      details
    );
  }
}

export class SearchColoniasError extends ColoniaError {
  constructor(reason: string, filters?: Record<string, any>) {
    super(
      `Error en búsqueda de colonias: ${reason}`,
      'search',
      { filters }
    );
  }
}