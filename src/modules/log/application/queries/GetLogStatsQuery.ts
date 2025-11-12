import { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import { LogStats } from '../../domain/entities/Log.js';
import { LogStatsError, LogFileSystemError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getLogStatsQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetLogStatsQuery {
  constructor(private logRepo: ILogRepository) {}

  async execute(_userId?: string): Promise<LogStats> {
    try {
      logger.info({
        operation: 'getLogStats',
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Consultando estadísticas de logs');

      const stats = await this.logRepo.getStats();

      logger.info({
        operation: 'getLogStats',
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
        fileCount: stats.files.length,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Estadísticas de logs obtenidas exitosamente');

      return stats;
    } catch (error) {
      // Manejar errores específicos del sistema de archivos
      if ((error as Error).message?.includes('ENOENT') || (error as Error).message?.includes('ENOTDIR')) {
        logger.error({
          operation: 'getLogStats',
          error: (error as Error).message,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error del sistema de archivos al obtener estadísticas de logs');
        throw new LogFileSystemError('getStats', 'logs directory', error as Error);
      }

      logger.error({
        operation: 'getLogStats',
        error: (error as Error).message,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar estadísticas de logs');

      throw new LogStatsError('getStats', error as Error);
    }
  }
}
