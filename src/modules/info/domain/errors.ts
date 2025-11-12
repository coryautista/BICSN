import { DomainError } from '../../../utils/errors.js';

/**
 * Errores específicos del dominio Info
 */

// Error base para el dominio Info
export class InfoError extends DomainError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'InfoError';
  }
}

// Error cuando un Info no se encuentra
export class InfoNotFoundError extends InfoError {
  constructor(infoId: number) {
    super(
      `La información con ID ${infoId} no fue encontrada`,
      'INFO_NOT_FOUND',
      { infoId }
    );
    this.name = 'InfoNotFoundError';
  }
}

// Error cuando ya existe un Info con el mismo nombre
export class InfoAlreadyExistsError extends InfoError {
  constructor(nombre: string) {
    super(
      `Ya existe una información con el nombre '${nombre}'`,
      'INFO_ALREADY_EXISTS',
      { nombre }
    );
    this.name = 'InfoAlreadyExistsError';
  }
}

// Error de validación para el nombre del Info
export class InvalidInfoNameError extends InfoError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_INFO_NAME',
      { nombre, reason }
    );
    this.name = 'InvalidInfoNameError';
  }
}

// Error de validación para colores
export class InvalidInfoColorError extends InfoError {
  constructor(colorType: string, colorValue: string) {
    super(
      `El color ${colorType} '${colorValue}' no tiene un formato válido`,
      'INVALID_INFO_COLOR',
      { colorType, colorValue }
    );
    this.name = 'InvalidInfoColorError';
  }
}

// Error cuando el ID del Info es inválido
export class InvalidInfoIdError extends InfoError {
  constructor(id: any) {
    super(
      `El ID '${id}' no es un número entero válido`,
      'INVALID_INFO_ID',
      { id }
    );
    this.name = 'InvalidInfoIdError';
  }
}

// Error cuando faltan datos requeridos para crear un Info
export class InfoCreationDataMissingError extends InfoError {
  constructor(missingFields: string[]) {
    super(
      `Faltan datos requeridos para crear la información: ${missingFields.join(', ')}`,
      'INFO_CREATION_DATA_MISSING',
      { missingFields }
    );
    this.name = 'InfoCreationDataMissingError';
  }
}

// Error cuando ocurre un problema al acceder al repositorio
export class InfoRepositoryError extends InfoError {
  constructor(operation: string, originalError?: any) {
    super(
      `Error en el repositorio durante la operación '${operation}'`,
      'INFO_REPOSITORY_ERROR',
      { operation, originalError: originalError?.message }
    );
    this.name = 'InfoRepositoryError';
  }
}