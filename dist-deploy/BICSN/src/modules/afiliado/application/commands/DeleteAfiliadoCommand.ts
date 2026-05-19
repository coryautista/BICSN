import { IAfiliadoRepository } from '../../domain/repositories/IAfiliadoRepository.js';
import pino from 'pino';
import {
  AfiliadoNotFoundError,
  AfiliadoDeletionError,
  InvalidAfiliadoDataError
} from '../../domain/errors.js';

const logger = pino({
  name: 'deleteAfiliadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteAfiliadoCommand {
  constructor(private afiliadoRepo: IAfiliadoRepository) {}

  async execute(id: number): Promise<void> {
    const logContext = {
      operation: 'deleteAfiliado',
      afiliadoId: id
    };

    logger.info(logContext, 'Iniciando eliminación de afiliado');

    // Validar que el ID sea válido
    if (!id || id <= 0) {
      logger.warn(logContext, 'ID de afiliado inválido para eliminación');
      throw new InvalidAfiliadoDataError('id', 'ID de afiliado inválido');
    }

    try {
      const exists = await this.afiliadoRepo.findById(id);
      if (!exists) {
        logger.warn(logContext, 'Afiliado no encontrado para eliminación');
        throw new AfiliadoNotFoundError({ id });
      }

      await this.afiliadoRepo.delete(id);
      logger.info({ ...logContext, success: true }, 'Afiliado eliminado exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al eliminar afiliado');

      if (error instanceof AfiliadoNotFoundError) {
        throw error;
      }

      throw new AfiliadoDeletionError('Error al eliminar afiliado', {
        originalError: errorMessage,
        afiliadoId: id
      });
    }
  }
}
