import { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import { CleanupResult } from '../../domain/entities/Log.js';
import {
  InvalidLogCleanupParamsError,
  LogCleanupError,
  LogPermissionError,
  LogFileSystemError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'cleanupLogsCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CleanupLogsInput {
  maxAgeDays: number;
  maxFiles: number;
}

export class CleanupLogsCommand {
  constructor(private logRepo: ILogRepository) {}

  async execute(input: CleanupLogsInput, _userId?: string): Promise<CleanupResult> {
    try {
      logger.info({
        operation: 'cleanupLogs',
        maxAgeDays: input.maxAgeDays,
        maxFiles: input.maxFiles,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando limpieza de logs');

      // Validaciones de entrada
      this.validateInput(input);

      const result = await this.logRepo.cleanup(input.maxAgeDays, input.maxFiles);

      logger.info({
        operation: 'cleanupLogs',
        deletedFiles: result.deletedFiles.length,
        totalDeleted: result.totalDeleted,
        maxAgeDays: input.maxAgeDays,
        maxFiles: input.maxFiles,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Limpieza de logs completada exitosamente');

      return result;
    } catch (error) {
      if (error instanceof InvalidLogCleanupParamsError) {
        throw error;
      }

      // Manejar errores específicos del repositorio
      if ((error as Error).message?.includes('EACCES') || (error as Error).message?.includes('EPERM')) {
        logger.error({
          operation: 'cleanupLogs',
          error: (error as Error).message,
          maxAgeDays: input.maxAgeDays,
          maxFiles: input.maxFiles,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error de permisos en limpieza de logs');
        throw new LogPermissionError('cleanup');
      }

      if ((error as Error).message?.includes('ENOENT') || (error as Error).message?.includes('ENOTDIR')) {
        logger.error({
          operation: 'cleanupLogs',
          error: (error as Error).message,
          maxAgeDays: input.maxAgeDays,
          maxFiles: input.maxFiles,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error del sistema de archivos en limpieza de logs');
        throw new LogFileSystemError('cleanup', 'logs directory', error as Error);
      }

      logger.error({
        operation: 'cleanupLogs',
        error: (error as Error).message,
        maxAgeDays: input.maxAgeDays,
        maxFiles: input.maxFiles,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al limpiar logs');

      throw new LogCleanupError('cleanup', error as Error);
    }
  }

  private validateInput(input: CleanupLogsInput): void {
    // Validar maxAgeDays
    if (!Number.isInteger(input.maxAgeDays) || input.maxAgeDays <= 0) {
      throw new InvalidLogCleanupParamsError(
        'maxAgeDays',
        input.maxAgeDays,
        'debe ser un número entero positivo'
      );
    }

    if (input.maxAgeDays > 365) {
      throw new InvalidLogCleanupParamsError(
        'maxAgeDays',
        input.maxAgeDays,
        'no puede ser mayor a 365 días'
      );
    }

    // Validar maxFiles
    if (!Number.isInteger(input.maxFiles) || input.maxFiles <= 0) {
      throw new InvalidLogCleanupParamsError(
        'maxFiles',
        input.maxFiles,
        'debe ser un número entero positivo'
      );
    }

    if (input.maxFiles > 10000) {
      throw new InvalidLogCleanupParamsError(
        'maxFiles',
        input.maxFiles,
        'no puede ser mayor a 10000 archivos'
      );
    }
  }
}
