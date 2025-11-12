import { ICalleRepository } from '../../domain/repositories/ICalleRepository.js';
import { DeleteCalleData } from '../../domain/entities/Calle.js';
import {
  CalleNotFoundError,
  InvalidCalleDataError,
  CalleDeletionError,
  CalleInUseError,
  CalleSystemError
} from '../../domain/errors.js';

// Logger básico para comandos
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export class DeleteCalleCommand {
  constructor(private calleRepo: ICalleRepository) {}

  async execute(data: DeleteCalleData): Promise<number> {
    try {
      logger.info('Iniciando proceso de eliminación de calle', {
        calleId: data.calleId
      });

      // Validar calleId
      if (!data.calleId || typeof data.calleId !== 'number' || data.calleId <= 0) {
        throw new InvalidCalleDataError('ID de calle inválido');
      }

      // Verificar existencia de la calle
      logger.debug('Verificando existencia de la calle');
      const existing = await this.calleRepo.findById(data.calleId);
      if (!existing) {
        logger.warn('Intento de eliminar calle inexistente', {
          calleId: data.calleId
        });
        throw new CalleNotFoundError(data.calleId);
      }

      logger.debug('Calle encontrada, verificando restricciones de eliminación');

      // Aquí podríamos agregar verificaciones adicionales como:
      // - Verificar si la calle está siendo utilizada en otras entidades
      // - Verificar permisos específicos para eliminación
      // Por ahora, procedemos con la eliminación

      try {
        const deletedCount = await this.calleRepo.delete(data.calleId);

        if (deletedCount === 0) {
          logger.warn('No se pudo eliminar la calle (posiblemente ya eliminada)', {
            calleId: data.calleId,
            nombreCalle: existing.nombreCalle
          });
          throw new CalleDeletionError(data.calleId, 'No se pudo eliminar la calle');
        }

        logger.info('Calle eliminada exitosamente', {
          calleId: data.calleId,
          nombreCalle: existing.nombreCalle,
          coloniaId: existing.coloniaId,
          deletedCount
        });

        return deletedCount;

      } catch (error: any) {
        // Manejar errores específicos de base de datos
        if (error.message && error.message.includes('FOREIGN KEY constraint')) {
          logger.warn('Intento de eliminar calle en uso (restricción de clave foránea)', {
            calleId: data.calleId,
            nombreCalle: existing.nombreCalle
          });
          throw new CalleInUseError(data.calleId, ['referencias pendientes']);
        }

        // Re-lanzar otros errores
        throw error;
      }

    } catch (error) {
      if (error instanceof CalleNotFoundError ||
          error instanceof InvalidCalleDataError ||
          error instanceof CalleDeletionError ||
          error instanceof CalleInUseError) {
        throw error;
      }

      logger.error('Error durante la eliminación de calle', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        calleId: data.calleId,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new CalleSystemError('Error interno durante la eliminación de calle');
    }
  }
}
