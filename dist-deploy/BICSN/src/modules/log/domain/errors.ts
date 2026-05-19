import { DomainError } from '../../../utils/errors.js';

/**
 * Errores específicos del dominio Log
 */

// Error base para el dominio Log
export class LogError extends DomainError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'LogError';
  }
}

// Error cuando ocurre un problema con las estadísticas de logs
export class LogStatsError extends LogError {
  constructor(operation: string, originalError?: any) {
    super(
      `Error al obtener estadísticas de logs durante la operación '${operation}'`,
      'LOG_STATS_ERROR',
      { operation, originalError: originalError?.message }
    );
    this.name = 'LogStatsError';
  }
}

// Error cuando ocurre un problema al leer el contenido de un log
export class LogContentError extends LogError {
  constructor(fileName: string, originalError?: any) {
    super(
      `Error al leer el contenido del archivo de log '${fileName}'`,
      'LOG_CONTENT_ERROR',
      { fileName, originalError: originalError?.message }
    );
    this.name = 'LogContentError';
  }
}

// Error cuando ocurre un problema en la búsqueda de logs
export class LogSearchError extends LogError {
  constructor(query: string, originalError?: any) {
    super(
      `Error al buscar en logs con la consulta '${query}'`,
      'LOG_SEARCH_ERROR',
      { query, originalError: originalError?.message }
    );
    this.name = 'LogSearchError';
  }
}

// Error cuando ocurre un problema en la limpieza de logs
export class LogCleanupError extends LogError {
  constructor(operation: string, originalError?: any) {
    super(
      `Error durante la limpieza de logs en la operación '${operation}'`,
      'LOG_CLEANUP_ERROR',
      { operation, originalError: originalError?.message }
    );
    this.name = 'LogCleanupError';
  }
}

// Error cuando ocurre un problema en el archivado de logs
export class LogArchiveError extends LogError {
  constructor(operation: string, originalError?: any) {
    super(
      `Error durante el archivado de logs en la operación '${operation}'`,
      'LOG_ARCHIVE_ERROR',
      { operation, originalError: originalError?.message }
    );
    this.name = 'LogArchiveError';
  }
}

// Error de validación para parámetros de limpieza de logs
export class InvalidLogCleanupParamsError extends LogError {
  constructor(param: string, value: any, reason: string) {
    super(
      `Parámetro de limpieza de logs inválido: ${param} = ${value}. ${reason}`,
      'INVALID_LOG_CLEANUP_PARAMS',
      { param, value, reason }
    );
    this.name = 'InvalidLogCleanupParamsError';
  }
}

// Error de validación para parámetros de archivado de logs
export class InvalidLogArchiveParamsError extends LogError {
  constructor(param: string, value: any, reason: string) {
    super(
      `Parámetro de archivado de logs inválido: ${param} = ${value}. ${reason}`,
      'INVALID_LOG_ARCHIVE_PARAMS',
      { param, value, reason }
    );
    this.name = 'InvalidLogArchiveParamsError';
  }
}

// Error cuando no se encuentra un archivo de log específico
export class LogFileNotFoundError extends LogError {
  constructor(fileName: string) {
    super(
      `Archivo de log '${fileName}' no encontrado`,
      'LOG_FILE_NOT_FOUND',
      { fileName }
    );
    this.name = 'LogFileNotFoundError';
  }
}

// Error cuando ocurre un problema de permisos en operaciones de log
export class LogPermissionError extends LogError {
  constructor(operation: string, fileName?: string) {
    super(
      `Permisos insuficientes para la operación '${operation}'${fileName ? ` en el archivo '${fileName}'` : ''}`,
      'LOG_PERMISSION_ERROR',
      { operation, fileName }
    );
    this.name = 'LogPermissionError';
  }
}

// Error cuando ocurre un problema con el sistema de archivos para logs
export class LogFileSystemError extends LogError {
  constructor(operation: string, path: string, originalError?: any) {
    super(
      `Error del sistema de archivos durante '${operation}' en la ruta '${path}'`,
      'LOG_FILESYSTEM_ERROR',
      { operation, path, originalError: originalError?.message }
    );
    this.name = 'LogFileSystemError';
  }
}