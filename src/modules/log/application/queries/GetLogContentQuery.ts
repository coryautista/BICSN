import { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import { LogContent } from '../../domain/entities/Log.js';
import {
  LogContentError,
  LogFileNotFoundError,
  LogFileSystemError,
  LogPermissionError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getLogContentQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface GetLogContentInput {
  fileName: string;
  lines: number;
}

export class GetLogContentQuery {
  constructor(private logRepo: ILogRepository) {}

  async execute(input: GetLogContentInput, _userId?: string): Promise<LogContent> {
    try {
      logger.info({
        operation: 'getLogContent',
        fileName: input.fileName,
        lines: input.lines,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Consultando contenido de archivo de log');

      // Validaciones de entrada
      this.validateInput(input);

      const result = await this.logRepo.getContent(input.fileName, input.lines);

      // Verificar si el archivo existe
      if (!result.content && result.totalLines === 0) {
        logger.warn({
          operation: 'getLogContent',
          fileName: input.fileName,
          lines: input.lines,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Archivo de log no encontrado');
        throw new LogFileNotFoundError(input.fileName);
      }

      logger.info({
        operation: 'getLogContent',
        fileName: input.fileName,
        lines: input.lines,
        totalLines: result.totalLines,
        hasMore: result.hasMore,
        contentLength: result.content.length,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Contenido de log obtenido exitosamente');

      return result;
    } catch (error) {
      if (error instanceof LogFileNotFoundError) {
        throw error;
      }

      // Manejar errores específicos del sistema de archivos
      if ((error as Error).message?.includes('ENOENT')) {
        logger.error({
          operation: 'getLogContent',
          error: (error as Error).message,
          fileName: input.fileName,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Archivo de log no encontrado en el sistema de archivos');
        throw new LogFileNotFoundError(input.fileName);
      }

      if ((error as Error).message?.includes('EACCES') || (error as Error).message?.includes('EPERM')) {
        logger.error({
          operation: 'getLogContent',
          error: (error as Error).message,
          fileName: input.fileName,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error de permisos al leer archivo de log');
        throw new LogPermissionError('read', input.fileName);
      }

      if ((error as Error).message?.includes('ENOTDIR')) {
        logger.error({
          operation: 'getLogContent',
          error: (error as Error).message,
          fileName: input.fileName,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error del sistema de archivos al acceder al directorio de logs');
        throw new LogFileSystemError('read', input.fileName, error as Error);
      }

      logger.error({
        operation: 'getLogContent',
        error: (error as Error).message,
        fileName: input.fileName,
        lines: input.lines,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar contenido de log');

      throw new LogContentError(input.fileName, error as Error);
    }
  }

  private validateInput(input: GetLogContentInput): void {
    // Validar fileName
    if (!input.fileName || typeof input.fileName !== 'string' || input.fileName.trim().length === 0) {
      throw new Error('LOG_INVALID_FILENAME: El nombre del archivo es requerido y no puede estar vacío');
    }

    const fileName = input.fileName.trim();

    // Validar caracteres peligrosos en el nombre del archivo
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(fileName)) {
      throw new Error(`LOG_INVALID_FILENAME: El nombre del archivo contiene caracteres no válidos: ${fileName}`);
    }

    // Validar extensión del archivo (debe ser .log)
    if (!fileName.endsWith('.log')) {
      throw new Error(`LOG_INVALID_FILENAME: El archivo debe tener extensión .log: ${fileName}`);
    }

    // Validar longitud del nombre
    if (fileName.length > 255) {
      throw new Error(`LOG_INVALID_FILENAME: El nombre del archivo es demasiado largo: ${fileName}`);
    }

    // Validar lines
    if (!Number.isInteger(input.lines) || input.lines <= 0) {
      throw new Error(`LOG_INVALID_LINES: El número de líneas debe ser un entero positivo: ${input.lines}`);
    }

    if (input.lines > 10000) {
      throw new Error(`LOG_INVALID_LINES: El número máximo de líneas es 10000: ${input.lines}`);
    }
  }
}
