import { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import { ArchiveResult } from '../../domain/entities/Log.js';
import {
  InvalidLogArchiveParamsError,
  LogArchiveError,
  LogPermissionError,
  LogFileSystemError
} from '../../domain/errors.js';
import pino from 'pino';
import path from 'path';

const logger = pino({
  name: 'archiveLogsCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface ArchiveLogsInput {
  archiveDir?: string;
}

export class ArchiveLogsCommand {
  constructor(private logRepo: ILogRepository) {}

  async execute(input: ArchiveLogsInput, _userId?: string): Promise<ArchiveResult> {
    try {
      logger.info({
        operation: 'archiveLogs',
        archiveDir: input.archiveDir,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando archivado de logs');

      // Validaciones de entrada
      this.validateInput(input);

      const result = await this.logRepo.archive(input.archiveDir);

      logger.info({
        operation: 'archiveLogs',
        archivedFiles: result.archivedFiles.length,
        totalArchived: result.totalArchived,
        archiveDir: input.archiveDir,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Archivado de logs completado exitosamente');

      return result;
    } catch (error) {
      if (error instanceof InvalidLogArchiveParamsError) {
        throw error;
      }

      // Manejar errores específicos del repositorio
      if ((error as Error).message?.includes('EACCES') || (error as Error).message?.includes('EPERM')) {
        logger.error({
          operation: 'archiveLogs',
          error: (error as Error).message,
          archiveDir: input.archiveDir,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error de permisos en archivado de logs');
        throw new LogPermissionError('archive');
      }

      if ((error as Error).message?.includes('ENOENT') || (error as Error).message?.includes('ENOTDIR')) {
        logger.error({
          operation: 'archiveLogs',
          error: (error as Error).message,
          archiveDir: input.archiveDir,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error del sistema de archivos en archivado de logs');
        throw new LogFileSystemError('archive', input.archiveDir || 'default archive directory', error as Error);
      }

      logger.error({
        operation: 'archiveLogs',
        error: (error as Error).message,
        archiveDir: input.archiveDir,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al archivar logs');

      throw new LogArchiveError('archive', error as Error);
    }
  }

  private validateInput(input: ArchiveLogsInput): void {
    // Validar archiveDir si está presente
    if (input.archiveDir) {
      // Validar que no contenga caracteres peligrosos
      const dangerousChars = /[<>:"|?*\x00-\x1f]/;
      if (dangerousChars.test(input.archiveDir)) {
        throw new InvalidLogArchiveParamsError(
          'archiveDir',
          input.archiveDir,
          'contiene caracteres no válidos'
        );
      }

      // Validar longitud
      if (input.archiveDir.length > 260) {
        throw new InvalidLogArchiveParamsError(
          'archiveDir',
          input.archiveDir,
          'la ruta es demasiado larga (máximo 260 caracteres)'
        );
      }

      // Validar que no sea una ruta absoluta peligrosa
      const resolvedPath = path.resolve(input.archiveDir);
      const rootDir = path.parse(process.cwd()).root;

      if (!resolvedPath.startsWith(rootDir)) {
        throw new InvalidLogArchiveParamsError(
          'archiveDir',
          input.archiveDir,
          'la ruta debe estar dentro del directorio raíz del sistema'
        );
      }

      // Validar que no intente acceder a directorios del sistema
      const systemDirs = ['/bin', '/sbin', '/boot', '/sys', '/proc', '/dev', 'C:\\Windows', 'C:\\System32'];
      for (const systemDir of systemDirs) {
        if (resolvedPath.toLowerCase().includes(systemDir.toLowerCase())) {
          throw new InvalidLogArchiveParamsError(
            'archiveDir',
            input.archiveDir,
            'no se permite acceder a directorios del sistema'
          );
        }
      }
    }
  }
}
